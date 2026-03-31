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

export default function FarmaceuticosScreen() {
  const [farmaceuticos, setFarmaceuticos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showNotification } = useNotification();

  const listarFarmaceuticos = useCallback(async (skip = 0, take = 50) => {
    try {
      setLoading(true);
      const response = await api.get("/farmaceuticos", {
        params: { skip, take },
      });
      const dados = response.data.farmaceuticos || response.data;
      if (dados && Array.isArray(dados)) {
        setFarmaceuticos(dados);
      }
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao carregar farmacêuticos";
      console.error("❌ Erro:", mensagem);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      listarFarmaceuticos();
    }, [listarFarmaceuticos]),
  );

  const handleEditClick = (id: string | undefined) => {
    if (id) {
      router.push({ pathname: "/farmaceuticos/editar", params: { id } });
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
        await api.delete(`/farmaceuticos/${itemToDelete}`);
        showNotification("success", "Farmacêutico excluído com sucesso!");
        listarFarmaceuticos();
      } catch (error: any) {
        const mensagem =
          error.response?.data?.erro ||
          error.response?.data?.message ||
          error.message ||
          "Falha ao deletar farmacêutico";
        showNotification("error", mensagem);
      }
    }
    setModalVisible(false);
    setItemToDelete(null);
  };

  const filteredFarmaceuticos = farmaceuticos.filter(
    (f) =>
      (f.nome?.toLowerCase?.().includes(busca.toLowerCase()) ||
        f.email?.toLowerCase?.().includes(busca.toLowerCase()) ||
        f.telefone?.includes(busca)) ??
      false,
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Farmacêuticos</Text>
          <Text style={styles.pageSubtitle}>
            Gerencie os profissionais farmacêuticos
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/farmaceuticos/cadastro")}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Cadastrar farmacêutico</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de farmacêuticos</Text>

          <View style={styles.searchContainer}>
            <Search
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar farmacêuticos"
              placeholderTextColor={Colors.textSecondary}
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          <FlatList
            data={filteredFarmaceuticos}
            keyExtractor={(item, index) =>
              item.id_farmaceutico
                ? String(item.id_farmaceutico)
                : String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
                    Carregando farmacêuticos...
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
                  Nenhum farmaceutico encontrado.
                </Text>
              )
            }
            renderItem={({ item, index }) => (
              <ItemLista
                data={[
                  {
                    label: "Nome",
                    value: item.nome || "N/A",
                  },
                  { label: "Email", value: item.email || "N/A" },
                  { label: "Telefone", value: item.telefone || "N/A" },
                  {
                    label: "Especialidade",
                    value: item.especialidade || "N/A",
                  },
                  { label: "CRF", value: item.crf || "N/A" },
                ]}
                isLast={index === filteredFarmaceuticos.length - 1}
                onEdit={() => handleEditClick(String(item.id_farmaceutico))}
                onDelete={() => handleDeleteClick(String(item.id_farmaceutico))}
              />
            )}
          />
        </View>

        <ModalExclusao
          visible={modalVisible}
          tipo="farmacêutico"
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
