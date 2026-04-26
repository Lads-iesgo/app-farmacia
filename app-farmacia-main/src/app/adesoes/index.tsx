import { useFocusEffect, useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../_components/Colors";
import Header from "../_components/Header";
import ItemLista from "../_components/ItemLista";
import ModalExclusao from "../_components/ModalExclusao";
import { useNotification } from "../_components/NotificationContext";
import api from "../services/api";

const formatarData = (data: string) => {
  if (!data) return "N/A";
  try {
    const date = new Date(data);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return "N/A";
  }
};

export default function AdesoesScreen() {
  const [adesoes, setAdesoes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [tratamentos, setTratamentos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const { showNotification } = useNotification();

  const listarAdesoes = useCallback(async () => {
    try {
      setLoading(true);
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const role = (await AsyncStorage.getItem("@app-farmacia:userRole")) || "";
      let idStr = (await AsyncStorage.getItem("@app-farmacia:userId")) || "";

      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));
            idStr = String(
              decoded?.id_usuario || decoded?.id || decoded?.sub || idStr,
            );
          }
        } catch {}
      }

      setUserRole(role.toUpperCase());
      setUserId(idStr);

      const [adesResponse, pacResponse, tratResponse, medResponse] =
        await Promise.all([
          api
            .get("/adesoes", { params: { skip: 0, take: 100 } })
            .catch(() => ({ data: [] })),
          api
            .get("/pacientes", { params: { skip: 0, take: 100 } })
            .catch(() => ({ data: [] })),
          api
            .get("/tratamentos", { params: { skip: 0, take: 100 } })
            .catch(() => ({ data: [] })),
          api
            .get("/medicamentos", { params: { skip: 0, take: 100 } })
            .catch(() => ({ data: [] })),
        ]);

      let adesDados =
        adesResponse.data.adesoes ||
        adesResponse.data.dados ||
        (Array.isArray(adesResponse.data) ? adesResponse.data : []);
      const pacDados =
        pacResponse.data.pacientes ||
        pacResponse.data.dados ||
        (Array.isArray(pacResponse.data) ? pacResponse.data : []);

      if (role.toUpperCase() === "PACIENTE") {
        const me = pacDados.find(
          (p: any) => String(p.id_usuario) === String(idStr),
        );
        if (me) {
          adesDados = adesDados.filter(
            (a: any) => String(a.id_paciente) === String(me.id_paciente),
          );
        } else {
          adesDados = [];
        }
      } else if (
        role.toUpperCase() === "ALUNO" ||
        role.toUpperCase() === "FARMACEUTICO"
      ) {
        const tratDados =
          tratResponse.data.tratamentos ||
          tratResponse.data.dados ||
          (Array.isArray(tratResponse.data) ? tratResponse.data : []);

        const meusPacientesIds = tratDados
          .filter(
            (t: any) =>
              String(t.id_usuario_criador) === String(idStr) ||
              String(t.id_farmaceutico) === String(idStr),
          )
          .map((t: any) => String(t.id_paciente));

        // E adiciona pacientes que o usuário cadastrou manualmente
        const storedCriados = await AsyncStorage.getItem(
          "@app-farmacia:meusPacientesCriados",
        );
        const meusCriadosLocal = storedCriados ? JSON.parse(storedCriados) : [];

        const todosMeusPacientes = [...meusPacientesIds, ...meusCriadosLocal];

        adesDados = adesDados.filter((a: any) =>
          todosMeusPacientes.includes(String(a.id_paciente)),
        );
      }

      setAdesoes(adesDados);
      setPacientes(pacDados);
      setTratamentos(
        tratResponse.data.tratamentos ||
          tratResponse.data.dados ||
          (Array.isArray(tratResponse.data) ? tratResponse.data : []),
      );
      setMedicamentos(
        medResponse.data.medicamentos ||
          medResponse.data.dados ||
          (Array.isArray(medResponse.data) ? medResponse.data : []),
      );
    } catch (error: any) {
      const mensagem = error.message || "Falha ao carregar adesões";
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      listarAdesoes();
    }, [listarAdesoes]),
  );

  const handleDeleteClick = (id: string | undefined) => {
    if (id) {
      setItemToDelete(id);
      setModalVisible(true);
    }
  };

  const confirmarExclusao = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/adesoes/${itemToDelete}`);
        showNotification("success", "Adesão excluída com sucesso!");
        listarAdesoes();
      } catch (error: any) {
        const mensagem =
          error.response?.data?.erro ||
          error.response?.data?.message ||
          error.message ||
          "Falha ao deletar adesão";
        showNotification("error", mensagem);
      }
    }
    setModalVisible(false);
    setItemToDelete(null);
  };

  const filteredAdesoes = adesoes.filter((a) => {
    // mostrar contexto e dados dos pacientes
    const paciente = pacientes.find((p) => p.id_paciente === a.id_paciente);
    const pacienteNome =
      (paciente as any)?.usuario?.nome || (paciente as any)?.nome || "";
    return (
      pacienteNome?.toLowerCase().includes(busca.toLowerCase()) ||
      a.status?.toLowerCase().includes(busca.toLowerCase()) ||
      formatarData(a.data_prevista).includes(busca) ||
      formatarData(a.data_tomada).includes(busca)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Adesões</Text>
          <Text style={styles.pageSubtitle}>
            Acompanhe a adesão aos tratamentos dos pacientes
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/adesoes/cadastro" as any)}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Registrar adesão</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de adesões</Text>

          <View style={styles.searchContainer}>
            <Search
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar adesões (Ex: Nome, Data)"
              placeholderTextColor={Colors.textSecondary}
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          <FlatList
            data={filteredAdesoes}
            keyExtractor={(item, index) =>
              item.id_adesao ? String(item.id_adesao) : String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
                    Carregando adesões...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    color: Colors.textSecondary,
                    marginTop: 20,
                  }}
                >
                  Nenhum paciente encontrado.
                </Text>
              )
            }
            renderItem={({ item, index }) => {
              const paciente = pacientes.find(
                (p) => p.id_paciente === item.id_paciente,
              );
              const tratamento = tratamentos.find(
                (t) => t.id_tratamento === item.id_tratamento,
              );
              const medicamento = medicamentos.find(
                (m) => m.id_medicamento === tratamento?.id_medicamento,
              );

              const nomePaciente =
                (paciente as any)?.usuario?.nome ||
                (paciente as any)?.nome ||
                "Paciente não encontrado";
              const nomeMedicamento =
                (medicamento as any)?.nome_medicamento ||
                "Medicamento não encontrado";

              return (
                <ItemLista
                  data={[
                    {
                      label: "Paciente",
                      value: nomePaciente,
                    },
                    {
                      label: "Medicamento",
                      value: nomeMedicamento,
                    },
                    {
                      label: "Data Prevista",
                      value: formatarData(item.data_prevista || ""),
                    },
                    {
                      label: "Data Tomada",
                      value: formatarData(item.data_tomada || ""),
                    },
                    {
                      label: "Status",
                      value: item.status || "N/A",
                    },
                  ]}
                  isLast={index === filteredAdesoes.length - 1}
                  onDelete={
                    userRole !== "PACIENTE"
                      ? () => handleDeleteClick(String(item.id_adesao))
                      : undefined
                  }
                />
              );
            }}
          />
        </View>

        {/* Reusing existing ModalExclusao, might need to adapt tipo se houver lógica hardcoded */}
        <ModalExclusao
          visible={modalVisible}
          tipo="adesão"
          onCancel={() => setModalVisible(false)}
          onConfirm={confirmarExclusao}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#002470ff",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  addButtonText: { color: Colors.white, fontWeight: "bold", marginLeft: 8 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: "100%", fontSize: 14, color: Colors.text },
  listContainer: { paddingBottom: 20 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});
