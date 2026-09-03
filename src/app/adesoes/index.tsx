// Importações de navegação e componentes do React Native
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

// ─── Utilitário de Formatação de Data ─────────────────────────────────────────
/**
 * Converte uma data em string ISO para o formato dd/mm/aaaa.
 * Retorna "N/A" caso a data seja inválida ou vazia.
 */
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

// ─── Tela de Listagem de Adesões ───────────────────────────────────────────────
export default function AdesoesScreen() {
  // Estado da lista de adesões e dados relacionados
  const [adesoes, setAdesoes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [tratamentos, setTratamentos] = useState<any[]>([]);

  // Estado da barra de pesquisa
  const [busca, setBusca] = useState("");

  // Controle do modal de confirmação de exclusão
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Controle de carregamento e dados do usuário logado
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  const router = useRouter();
  const { showNotification } = useNotification();

  // ─── Carregamento e Filtragem das Adesões ──────────────────────────────────
  /**
   * Busca adesões, pacientes, tratamentos e medicamentos em paralelo.
   * Filtra as adesões com base no papel (role) do usuário logado:
   * - PACIENTE: vê apenas suas próprias adesões
   * - ALUNO/FARMACEUTICO: vê adesões dos pacientes sob sua responsabilidade
   * - ADMIN/outros: vê todas as adesões
   */
  const listarAdesoes = useCallback(async () => {
    try {
      setLoading(true);
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;

      // Obtém o papel e o ID do usuário logado para filtrar os dados
      const role = (await AsyncStorage.getItem("@app-farmacia:userRole")) || "";
      let idStr = (await AsyncStorage.getItem("@app-farmacia:userId")) || "";

      // Tenta extrair o ID real do usuário a partir do JWT armazenado
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

      // Busca todos os dados necessários em paralelo; erros individuais retornam lista vazia
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

      // Normaliza as respostas para arrays, suportando diferentes formatos da API
      let adesDados =
        adesResponse.data.adesoes ||
        adesResponse.data.dados ||
        (Array.isArray(adesResponse.data) ? adesResponse.data : []);
      const pacDados =
        pacResponse.data.pacientes ||
        pacResponse.data.dados ||
        (Array.isArray(pacResponse.data) ? pacResponse.data : []);

      // Filtra as adesões de acordo com o papel do usuário logado
      if (role.toUpperCase() === "PACIENTE") {
        // Encontra o registro de paciente correspondente ao usuário logado
        const me = pacDados.find(
          (p: any) => String(p.id_usuario) === String(idStr),
        );
        if (me) {
          // Paciente vê apenas suas próprias adesões
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

        // Coleta os IDs dos pacientes vinculados aos tratamentos criados pelo usuário
        const meusPacientesIds = tratDados
          .filter(
            (t: any) =>
              String(t.id_usuario_criador) === String(idStr) ||
              String(t.id_farmaceutico) === String(idStr),
          )
          .map((t: any) => String(t.id_paciente));

        // Adiciona pacientes cadastrados manualmente pelo usuário (persistidos localmente)
        const storedCriados = await AsyncStorage.getItem(
          "@app-farmacia:meusPacientesCriados",
        );
        const meusCriadosLocal = storedCriados ? JSON.parse(storedCriados) : [];

        // Une os pacientes de ambas as fontes sem duplicatas
        const todosMeusPacientes = [...meusPacientesIds, ...meusCriadosLocal];

        // Filtra somente as adesões dos pacientes sob responsabilidade do usuário
        adesDados = adesDados.filter((a: any) =>
          todosMeusPacientes.includes(String(a.id_paciente)),
        );
      }

      // Atualiza os estados com os dados filtrados e normalizados
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

  // Recarrega as adesões sempre que a tela ganhar foco (ex: ao voltar do cadastro)
  useFocusEffect(
    React.useCallback(() => {
      listarAdesoes();
    }, [listarAdesoes]),
  );

  // ─── Controle de Exclusão ──────────────────────────────────────────────────

  /**
   * Abre o modal de confirmação de exclusão e armazena o ID do item a ser removido.
   */
  const handleDeleteClick = (id: string | undefined) => {
    if (id) {
      setItemToDelete(id);
      setModalVisible(true);
    }
  };

  /**
   * Confirma a exclusão da adesão na API e recarrega a lista.
   * Fecha o modal independentemente do resultado.
   */
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
    // Fecha o modal e limpa o item selecionado independentemente do resultado
    setModalVisible(false);
    setItemToDelete(null);
  };

  // ─── Filtragem por Busca ────────────────────────────────────────────────────
  /**
   * Filtra as adesões com base no texto digitado na barra de pesquisa.
   * Considera nome do paciente, status e datas.
   */
  const filteredAdesoes = adesoes.filter((a) => {
    // Resolve o nome do paciente vinculado à adesão para incluir na busca
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

  // ─── Renderização da Tela ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Cabeçalho da página com título e subtítulo */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Adesões</Text>
          <Text style={styles.pageSubtitle}>
            Acompanhe a adesão aos tratamentos dos pacientes
          </Text>
        </View>

        {/* Botão de nova adesão: visível apenas para usuários que não são pacientes */}
        {userRole !== "PACIENTE" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/adesoes/cadastro" as any)}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Registrar adesão</Text>
          </TouchableOpacity>
        )}

        {/* Card com a lista de adesões e barra de pesquisa */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de adesões</Text>

          {/* Barra de pesquisa para filtrar por nome, data ou status */}
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

          {/* Lista de adesões com suporte a estado de carregamento e lista vazia */}
          <FlatList
            data={filteredAdesoes}
            keyExtractor={(item, index) =>
              item.id_adesao ? String(item.id_adesao) : String(index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              loading ? (
                // Indicador de carregamento enquanto busca os dados
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
                    Carregando adesões...
                  </Text>
                </View>
              ) : (
                // Mensagem exibida quando não há adesões encontradas
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
              // Resolve os dados relacionados para exibição no item da lista
              const paciente = pacientes.find(
                (p) => p.id_paciente === item.id_paciente,
              );
              const tratamento = tratamentos.find(
                (t) => t.id_tratamento === item.id_tratamento,
              );
              // Encontra o medicamento pelo ID presente no tratamento relacionado
              const medicamento = medicamentos.find(
                (m) => m.id_medicamento === tratamento?.id_medicamento,
              );

              // Resolve o nome do paciente em diferentes formatos de resposta
              const nomePaciente =
                (paciente as any)?.usuario?.nome ||
                (paciente as any)?.nome ||
                "Paciente não encontrado";

              // Resolve o nome do medicamento com fallback descritivo
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
                  // Botão de exclusão disponível apenas para usuários que não são pacientes
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

        {/* Modal de confirmação de exclusão de adesão */}
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

// ─── Estilos da Tela ───────────────────────────────────────────────────────────
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
