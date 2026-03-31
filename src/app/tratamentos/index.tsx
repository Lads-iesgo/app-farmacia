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
    if (isNaN(date.getTime())) return data;
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return data;
  }
};

export default function TratamentosScreen() {
  const [tratamentos, setTratamentos] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [farmaceuticos, setFarmaceuticos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const { showNotification } = useNotification();

  const listarTratamentos = useCallback(async (skip = 0, take = 50) => {
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

      const [tratResponse, pacResponse, medResponse, farmResponse] =
        await Promise.all([
          api.get("/tratamentos", { params: { skip, take } }),
          api.get("/pacientes", { params: { skip: 0, take: 100 } }),
          api.get("/medicamentos", { params: { skip: 0, take: 100 } }),
          api
            .get("/farmaceuticos", { params: { skip: 0, take: 100 } })
            .catch(() => ({ data: [] })),
        ]);
      let dados =
        tratResponse.data.tratamentos ||
        tratResponse.data.dados ||
        (Array.isArray(tratResponse.data) ? tratResponse.data : []);
      const pacDados =
        pacResponse.data.dados ||
        pacResponse.data.pacientes ||
        (Array.isArray(pacResponse.data) ? pacResponse.data : []);

      if (role.toUpperCase() === "PACIENTE") {
        const me = pacDados.find(
          (p: any) => String(p.id_usuario) === String(idStr),
        );
        if (me) {
          dados = dados.filter(
            (t: any) => String(t.id_paciente) === String(me.id_paciente),
          );
        } else {
          dados = [];
        }
      } else if (
        role.toUpperCase() === "ALUNO" ||
        role.toUpperCase() === "FARMACEUTICO"
      ) {
        dados = dados.filter(
          (t: any) =>
            String(t.id_usuario_criador) === String(idStr) ||
            String(t.id_farmaceutico) === String(idStr),
        );
      }

      setTratamentos(dados);
      setPacientes(pacDados);
      const medDados =
        medResponse.data.medicamentos ||
        medResponse.data.dados ||
        (Array.isArray(medResponse.data) ? medResponse.data : []);
      setMedicamentos(medDados);

      const farmDados =
        farmResponse.data.farmaceuticos ||
        farmResponse.data.dados ||
        (Array.isArray(farmResponse.data) ? farmResponse.data : []);
      setFarmaceuticos(farmDados);
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao carregar tratamentos";
      console.error("❌ Erro:", mensagem);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  const getNomePaciente = (idPaciente: any) => {
    const paciente = pacientes.find((p) => p.id_paciente === idPaciente);
    return (
      paciente?.usuario?.nome ||
      paciente?.nome ||
      paciente?.numero_identificacao ||
      String(idPaciente)
    );
  };

  const getNomeMedicamento = (idMedicamento: any) => {
    const medicamento = medicamentos.find(
      (m) => m.id_medicamento === idMedicamento,
    );
    return medicamento?.nome_medicamento || String(idMedicamento);
  };

  const getNomeFarmaceutico = (idFarmaceutico: any) => {
    if (!idFarmaceutico) return "N/A";
    const farmaceutico = farmaceuticos.find(
      (f) => f.id_farmaceutico === idFarmaceutico,
    );
    return farmaceutico?.nome || farmaceutico?.email || String(idFarmaceutico);
  };

  useFocusEffect(
    React.useCallback(() => {
      listarTratamentos();
    }, [listarTratamentos]),
  );

  const handleEditClick = (id: string | undefined) => {
    if (id) {
      router.push({ pathname: "/tratamentos/editar", params: { id } });
    }
  };

  const handleDeleteClick = (id: string | undefined) => {
    if (id) {
      setItemToDelete(id);
      setModalVisible(true);
    }
  };

  const confirmarExclusao = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/tratamentos/${itemToDelete}`);
        showNotification("success", "Tratamento excluído com sucesso!");
        listarTratamentos();
      } catch (error: any) {
        const mensagem =
          error.response?.data?.erro ||
          error.response?.data?.message ||
          error.message ||
          "Falha ao deletar tratamento";
        showNotification("error", mensagem);
      }
    }
    setModalVisible(false);
    setItemToDelete(null);
  };

  const filteredTratamentos = tratamentos.filter(
    (t) =>
      (getNomePaciente(t.id_paciente)
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||
        getNomeMedicamento(t.id_medicamento)
          ?.toLowerCase()
          .includes(busca.toLowerCase()) ||
        t.frequencia?.toLowerCase().includes(busca.toLowerCase())) ??
      false,
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Tratamentos</Text>
          <Text style={styles.pageSubtitle}>
            Gerencie os tratamentos dos pacientes
          </Text>
        </View>

        {userRole !== "PACIENTE" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/tratamentos/cadastro")}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Adicionar tratamento</Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de tratamentos</Text>

          <View style={styles.searchContainer}>
            <Search
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar tratamentos"
              placeholderTextColor={Colors.textSecondary}
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          <FlatList
            data={filteredTratamentos}
            keyExtractor={(item, index) =>
              item.id_tratamento ? String(item.id_tratamento) : String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
                    Carregando tratamentos...
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
                  Nenhum tratamento encontrado.
                </Text>
              )
            }
            renderItem={({ item, index }) => (
              <ItemLista
                data={[
                  {
                    label: "Paciente",
                    value: getNomePaciente(item.id_paciente),
                  },
                  {
                    label: "Medicamento",
                    value: getNomeMedicamento(item.id_medicamento),
                  },
                  {
                    label: "Farmacêutico",
                    value: getNomeFarmaceutico(item.id_farmaceutico),
                  },
                  {
                    label: "Data de Início",
                    value: formatarData(item.data_inicio),
                  },
                  { label: "Frequência", value: item.frequencia },
                  {
                    label: "Data de Término",
                    value: item.data_fim
                      ? formatarData(item.data_fim)
                      : "Contínuo",
                  },
                  {
                    label: "Dosagem Prescrita",
                    value: item.dosagem_prescrita || "N/A",
                  },
                  {
                    label: "Motivo do Tratamento",
                    value: item.motivo_tratamento || "N/A",
                  },
                  {
                    label: "Instruções Especiais",
                    value: item.instrucoes_especiais || "N/A",
                  },
                ]}
                isLast={index === filteredTratamentos.length - 1}
                onEdit={
                  userRole !== "PACIENTE"
                    ? () => handleEditClick(String(item.id_tratamento))
                    : undefined
                }
                onDelete={
                  userRole !== "PACIENTE"
                    ? () => handleDeleteClick(String(item.id_tratamento))
                    : undefined
                }
              />
            )}
          />
        </View>

        <ModalExclusao
          visible={modalVisible}
          tipo="tratamento"
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
