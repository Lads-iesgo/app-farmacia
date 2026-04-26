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

const formatarData = (valor: string) => {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  return numeros
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
};

const converterDataParaISO = (data: string): string => {
  const partes = data.split("/");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return data;
};

export default function EditarTratamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

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

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const pacientesOptions = (pacientes || [])
    .filter((p) => p)
    .map((p) => ({
      label: p.usuario?.nome || p.nome || p.numero_identificacao || "Sem ID",
      value: p.id_paciente || "",
    }));
  const medicamentosOptions = (medicamentos || [])
    .filter((m) => m)
    .map((m) => ({
      label: m.nome_medicamento || "Sem nome",
      value: m.id_medicamento,
    }));

  const carregarDados = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [tratamentoRes, pacientesRes, medicamentosRes] = await Promise.all([
        api.get(`/tratamentos/${id}`),
        api.get("/pacientes"),
        api.get("/medicamentos"),
      ]);

      const tratamento =
        tratamentoRes.data?.tratamento ||
        tratamentoRes.data?.data ||
        tratamentoRes.data;
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

      if (!tratamento || typeof tratamento !== "object") {
        showNotification(
          "error",
          "Tratamento não encontrado ou dados inválidos",
        );
        router.back();
        return;
      }

      setForm({
        id_paciente: tratamento.id_paciente || "",
        id_medicamento: tratamento.id_medicamento || "",
        data_inicio: tratamento.data_inicio || "",
        frequencia: tratamento.frequencia || "",
        data_fim: tratamento.data_fim || "",
        dosagem: tratamento.dosagem || "",
        motivo: tratamento.motivo || "",
        instrucoes: tratamento.instrucoes || "",
      });
    } catch (error: any) {
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

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAtualizar = async () => {
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
      await api.put(`/tratamentos/${id}`, {
        id_paciente: form.id_paciente,
        id_medicamento: form.id_medicamento,
        data_inicio: converterDataParaISO(form.data_inicio),
        frequencia: form.frequencia || null,
        data_fim: form.data_fim ? converterDataParaISO(form.data_fim) : null,
        dosagem: form.dosagem || null,
        motivo: form.motivo || null,
        instrucoes: form.instrucoes || null,
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

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do tratamento</Text>

          <Select
            label="Paciente"
            placeholder="Selecione o paciente"
            value={form.id_paciente}
            options={pacientesOptions}
            onSelect={(val) => setForm({ ...form, id_paciente: val })}
            required
          />

          <Select
            label="Medicamento"
            placeholder="Selecione o medicamento"
            value={form.id_medicamento}
            options={medicamentosOptions}
            onSelect={(val) => setForm({ ...form, id_medicamento: val })}
            required
          />

          <FormInput
            label="Data de início"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_inicio}
            onChangeText={(v) =>
              setForm({ ...form, data_inicio: formatarData(v) })
            }
          />

          <FormInput
            label="Frequência"
            placeholder="Ex: Uma vez ao dia"
            value={form.frequencia}
            onChangeText={(v) => setForm({ ...form, frequencia: v })}
          />

          <FormInput
            label="Data de término"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_fim}
            onChangeText={(v) =>
              setForm({ ...form, data_fim: formatarData(v) })
            }
          />

          <FormInput
            label="Dosagem"
            placeholder="Ex: 500mg"
            value={form.dosagem}
            onChangeText={(v) => setForm({ ...form, dosagem: v })}
          />

          <FormInput
            label="Motivo"
            placeholder="Motivo do tratamento"
            value={form.motivo}
            onChangeText={(v) => setForm({ ...form, motivo: v })}
          />

          <FormInput
            label="Instruções"
            placeholder="Instruções especiais"
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.instrucoes}
            onChangeText={(v) => setForm({ ...form, instrucoes: v })}
          />

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
