// Importações de navegação e componentes do React Native
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../_components/Colors";
import FormInput from "../_components/FormInput";
import Header from "../_components/Header";
import { useNotification } from "../_components/NotificationContext";
import Select from "../_components/Select";
import api from "../services/api";

// ─── Utilitários de Formatação de Data ────────────────────────────────────────

/**
 * Formata uma string de entrada como data no padrão dd/mm/aaaa.
 * Remove caracteres não numéricos e insere as barras automaticamente.
 */
const formatarData = (valor: string) => {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  return numeros
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
};

/**
 * Converte uma data no formato dd/mm/aaaa para o formato ISO aaaa-mm-dd,
 * compatível com o padrão esperado pela API.
 */
const converterDataParaISO = (data: string): string => {
  const partes = data.split("/");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return data;
};

// ─── Tela de Edição de Tratamento ──────────────────────────────────────────────
export default function EditarTratamentoScreen() {
  const router = useRouter();
  // Obtém o ID do tratamento passado como parâmetro na rota
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();

  // Controle de carregamento para desabilitar botões durante requisições
  const [loading, setLoading] = useState(false);

  // Estado do formulário com os campos editáveis do tratamento
  const [form, setForm] = useState({
    id_paciente: "",
    id_medicamento: "",
    data_inicio: "",
    frequencia: "",
    data_fim: "",
    dosagem: "",
    motivo: "",
    instrucoes: "",
  });

  // Listas de pacientes e medicamentos para popular os selects
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);

  // Converte a lista de pacientes para o formato esperado pelo componente Select
  const pacientesOptions = (pacientes || [])
    .filter((p) => p)
    .map((p) => ({
      // Tenta obter o nome em diferentes formatos de resposta da API
      label: p.usuario?.nome || p.nome || p.numero_identificacao || "Sem ID",
      value: p.id_paciente || "",
    }));

  // Converte a lista de medicamentos para o formato esperado pelo componente Select
  const medicamentosOptions = (medicamentos || [])
    .filter((m) => m)
    .map((m) => ({
      label: m.nome_medicamento || "Sem nome",
      value: m.id_medicamento,
    }));

  // ─── Carregamento dos Dados ────────────────────────────────────────────────
  /**
   * Busca os dados do tratamento atual e as listas de pacientes/medicamentos em paralelo.
   * Preenche o formulário com os dados existentes após o carregamento.
   */
  const carregarDados = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [tratamentoRes, pacientesRes, medicamentosRes] = await Promise.all([
        api.get(`/tratamentos/${id}`),
        api.get("/pacientes"),
        api.get("/medicamentos"),
      ]);

      // Normaliza a resposta do tratamento, pois a API pode retornar formatos diferentes
      const tratamento =
        tratamentoRes.data?.tratamento ||
        tratamentoRes.data?.data ||
        tratamentoRes.data;

      // Normaliza as listas de pacientes e medicamentos
      setPacientes(
        pacientesRes.data?.dados ||
          pacientesRes.data?.pacientes ||
          pacientesRes.data?.data ||
          [],
      );
      setMedicamentos(
        medicamentosRes.data?.medicamentos ||
          medicamentosRes.data?.dados ||
          medicamentosRes.data?.data ||
          [],
      );

      // Verifica se o tratamento foi encontrado com sucesso
      if (!tratamento || typeof tratamento !== "object") {
        showNotification(
          "error",
          "Tratamento não encontrado ou dados inválidos",
        );
        router.back();
        return;
      }

      // Preenche o formulário com os dados do tratamento carregado
      setForm({
        id_paciente: tratamento.id_paciente || "",
        id_medicamento: tratamento.id_medicamento || "",
        data_inicio: tratamento.data_inicio || "",
        frequencia: tratamento.frequencia || "",
        data_fim: tratamento.data_fim || "",
        // Suporta campo com nome antigo (dosagem) ou novo (dosagem_prescrita)
        dosagem: tratamento.dosagem_prescrita || tratamento.dosagem || "",
        motivo: tratamento.motivo_tratamento || tratamento.motivo || "",
        instrucoes: tratamento.instrucoes_especiais || tratamento.instrucoes || "",
      });
    } catch (error: any) {
      // Extrai a mensagem mais descritiva disponível no erro
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao carregar tratamento";
      showNotification("error", mensagem);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Dispara o carregamento dos dados sempre que o ID da rota mudar
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── Submissão do Formulário ─────────────────────────────────────────────────
  /**
   * Valida os campos obrigatórios, converte as datas para ISO
   * e envia a atualização do tratamento à API.
   */
  const handleAtualizar = async () => {
    // Campos obrigatórios: paciente, medicamento e data de início
    if (!form.id_paciente || !form.id_medicamento || !form.data_inicio) {
      showNotification(
        "error",
        "Preencha pelo menos Paciente, Medicamento e Data de Início",
      );
      return;
    }

    if (!id || typeof id !== "string") return;

    try {
      setLoading(true);
      // Envia o tratamento atualizado com as datas convertidas para ISO
      await api.put(`/tratamentos/${id}`, {
        id_paciente: form.id_paciente,
        id_medicamento: form.id_medicamento,
        data_inicio: converterDataParaISO(form.data_inicio),
        frequencia: form.frequencia || null,
        // Converte a data de fim apenas se ela foi preenchida
        data_fim: form.data_fim ? converterDataParaISO(form.data_fim) : null,
        dosagem_prescrita: form.dosagem || null,
        motivo_tratamento: form.motivo || null,
        instrucoes_especiais: form.instrucoes || null,
      });
      showNotification("success", "Tratamento atualizado com sucesso!");
      router.push("/tratamentos");
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao atualizar tratamento";
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  };

  // ─── Renderização da Tela ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho com botão de voltar para a lista de tratamentos */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.push("/tratamentos")}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Editar tratamento</Text>
            <Text style={styles.pageSubtitle}>
              Atualize as informações do tratamento
            </Text>
          </View>
        </View>

        {/* Card do formulário de edição */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do tratamento</Text>

          {/* Select de paciente (campo obrigatório) */}
          <Select
            label="Paciente"
            placeholder="Selecione o paciente"
            value={form.id_paciente}
            options={pacientesOptions}
            onSelect={(val) => setForm({ ...form, id_paciente: val })}
            required
          />

          {/* Select de medicamento (campo obrigatório) */}
          <Select
            label="Medicamento"
            placeholder="Selecione o medicamento"
            value={form.id_medicamento}
            options={medicamentosOptions}
            onSelect={(val) => setForm({ ...form, id_medicamento: val })}
            required
          />

          {/* Campo de data de início com máscara automática */}
          <FormInput
            label="Data de início"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_inicio}
            onChangeText={(v) =>
              setForm({ ...form, data_inicio: formatarData(v) })
            }
          />

          {/* Campo de frequência em formato livre (ex: "Uma vez ao dia") */}
          <FormInput
            label="Frequência"
            placeholder="Ex: Uma vez ao dia"
            value={form.frequencia}
            onChangeText={(v) => setForm({ ...form, frequencia: v })}
          />

          {/* Campo de data de término (opcional) */}
          <FormInput
            label="Data de término"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_fim}
            onChangeText={(v) =>
              setForm({ ...form, data_fim: formatarData(v) })
            }
          />

          {/* Campo de dosagem prescrita (ex: "500mg") */}
          <FormInput
            label="Dosagem"
            placeholder="Ex: 500mg"
            value={form.dosagem}
            onChangeText={(v) => setForm({ ...form, dosagem: v })}
          />

          {/* Campo de motivo/sintoma que justifica o tratamento */}
          <FormInput
            label="Motivo do Tratamento - Sintoma"
            placeholder="Razão do tratamento / Sintoma"
            value={form.motivo}
            onChangeText={(v) => setForm({ ...form, motivo: v })}
          />

          {/* Campo de instruções especiais (multiline para textos longos) */}
          <FormInput
            label="Instruções"
            placeholder="Instruções especiais"
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.instrucoes}
            onChangeText={(v) => setForm({ ...form, instrucoes: v })}
          />

          {/* Botões de ação: atualizar e cancelar */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleAtualizar}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Atualizando..." : "Atualizar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push("/tratamentos")}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos da Tela ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backButton: { marginRight: 16 },
  pageTitle: { fontSize: 20, fontWeight: "bold", color: Colors.text },
  pageSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 20,
  },
  buttonsContainer: { marginTop: 8, gap: 12 },
  submitButton: {
    backgroundColor: "#0A1833",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: { color: Colors.text, fontSize: 16, fontWeight: "bold" },
});
