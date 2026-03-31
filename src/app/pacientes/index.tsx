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

export default function PacientesScreen() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const { showNotification } = useNotification();

  const listarPacientes = useCallback(async (skip = 0, take = 50) => {
    try {
      setLoading(true);

      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const role = (await AsyncStorage.getItem("@app-farmacia:userRole")) || "";
      const idStr = (await AsyncStorage.getItem("@app-farmacia:userId")) || "";
      setUserRole(role.toUpperCase());
      setUserId(idStr);

      const response = await api.get("/pacientes", { params: { skip, take } });
      let dados =
        response.data.dados ||
        response.data.pacientes ||
        (Array.isArray(response.data) ? response.data : []);

      if (role.toUpperCase() === "ALUNO") {
        try {
          const tratResponse = await api.get("/tratamentos", {
            params: { skip: 0, take: 500 },
          });
          const tratamentos =
            tratResponse.data.tratamentos ||
            tratResponse.data.dados ||
            (Array.isArray(tratResponse.data) ? tratResponse.data : []);

          const meusPacientes = tratamentos
            .filter((t: any) => String(t.id_usuario_criador) === String(idStr))
            .map((t: any) => String(t.id_paciente));

          // Ler também pacientes que o aluno criou neste dispositivo
          const storedCriados = await AsyncStorage.getItem(
            "@app-farmacia:meusPacientesCriados",
          );
          const meusCriadosLocal = storedCriados
            ? JSON.parse(storedCriados)
            : [];

          dados = dados.filter(
            (p: any) =>
              meusPacientes.includes(String(p.id_paciente)) ||
              meusCriadosLocal.includes(String(p.id_paciente)) ||
              String(p.id_usuario_criador) === String(idStr),
          );
        } catch (e) {
          console.error("Erro ao carregar tratamentos para filtro:", e);
        }
      }

      setPacientes(dados);
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao carregar pacientes";
      console.error("❌ Erro ao listar pacientes:", mensagem);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      listarPacientes();
    }, [listarPacientes]),
  );

  const handleEditClick = (id: string | undefined) => {
    if (id) {
      router.push({ pathname: "/pacientes/editar", params: { id } });
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
        await api.delete(`/pacientes/${itemToDelete}`);
        showNotification("success", "Paciente excluído com sucesso!");
        listarPacientes();
      } catch (error: any) {
        const mensagem =
          error.response?.data?.erro ||
          error.response?.data?.message ||
          error.message ||
          "Falha ao deletar paciente";
        showNotification("error", mensagem);
      }
    }
    setModalVisible(false);
    setItemToDelete(null);
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      ((p.usuario?.nome || p.nome || "")
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||
        p.numero_identificacao?.toLowerCase().includes(busca.toLowerCase()) ||
        p.endereco?.toLowerCase().includes(busca.toLowerCase())) ??
      false,
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Pacientes</Text>
          <Text style={styles.pageSubtitle}>
            Gerencie os pacientes cadastrados
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/pacientes/cadastro")}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Cadastrar paciente</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de pacientes</Text>

          <View style={styles.searchContainer}>
            <Search
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar pacientes"
              placeholderTextColor={Colors.textSecondary}
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          <FlatList
            data={filteredPacientes}
            keyExtractor={(item, index) =>
              item.id_paciente ? String(item.id_paciente) : String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
                    Carregando pacientes...
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
              const nomeExibir =
                item.usuario?.nome ||
                item.nome ||
                item.numero_identificacao ||
                "N/A";
              return (
                <ItemLista
                  data={[
                    {
                      label: "Nome",
                      value: nomeExibir,
                    },
                    {
                      label: "Identificação",
                      value: item.numero_identificacao,
                    },
                    {
                      label: "Data de Nascimento",
                      value: formatarData(item.data_nascimento),
                    },
                    {
                      label: "Gênero",
                      value: item.genero || "N/A",
                    },
                    { label: "Endereço", value: item.endereco || "N/A" },
                    { label: "Cidade", value: item.cidade || "N/A" },
                    { label: "Estado", value: item.estado || "N/A" },
                    { label: "CEP", value: item.cep || "N/A" },
                  ]}
                  isLast={index === filteredPacientes.length - 1}
                  onEdit={() => handleEditClick(item.id_paciente)}
                  onDelete={() => handleDeleteClick(item.id_paciente)}
                />
              );
            }}
          />
        </View>

        <ModalExclusao
          visible={modalVisible}
          tipo="paciente"
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
