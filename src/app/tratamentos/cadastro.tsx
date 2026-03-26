import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
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
import SelectField from "../_components/Select";
import api from "../services/api";

const formatarData = (valor: string) => {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
};

const converterDataParaISO = (data: string) => {
  if (!data || data.length < 10) return null;
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
};

export default function CadastroTratamentoScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    idPaciente: "",
    idMedicamento: "",
    dataInicio: "",
    frequencia: "",
    dataFim: "",
    dosagem: "",
    motivo: "",
    instrucoes: "",
  });

  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        const [pacResponse, medResponse] = await Promise.all([
          api.get("/pacientes", { params: { skip: 0, take: 100 } }),
          api.get("/medicamentos", { params: { skip: 0, take: 100 } }),
        ]);
        setPacientes(
          pacResponse.data.dados ||
            pacResponse.data.pacientes ||
            (Array.isArray(pacResponse.data) ? pacResponse.data : []),
        );
        setMedicamentos(
          medResponse.data.medicamentos ||
            medResponse.data.dados ||
            (Array.isArray(medResponse.data) ? medResponse.data : []),
        );
      } catch {
        showNotification("error", "Falha ao carregar dados");
      }
    };
    carregarDados();
  }, []);

  const handleCadastrar = async () => {
    if (
      !form.idPaciente ||
      !form.idMedicamento ||
      !form.dataInicio ||
      !form.frequencia
    ) {
      showNotification(
        "error",
        "Preencha campos obrigatórios: Paciente, Medicamento, Data e Frequência",
      );
      return;
    }

    setLoading(true);
    try {
      // Extrair id do usuário logado do token
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const token = await AsyncStorage.getItem("authToken");
      let idUsuarioCriador = null;
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));
            idUsuarioCriador =
              decoded?.id_usuario || decoded?.id || decoded?.sub;
          }
        } catch {}
      }

      if (!idUsuarioCriador) {
        showNotification(
          "error",
          "Usuário não identificado. Faça login novamente.",
        );
        setLoading(false);
        return;
      }

      await api.post("/tratamentos", {
        id_paciente: Number(form.idPaciente),
        id_medicamento: Number(form.idMedicamento),
        id_usuario_criador: Number(idUsuarioCriador),
        data_inicio: converterDataParaISO(form.dataInicio),
        frequencia: form.frequencia,
        data_fim: converterDataParaISO(form.dataFim) || null,
        dosagem_prescrita: form.dosagem || null,
        motivo_tratamento: form.motivo || null,
        instrucoes_especiais: form.instrucoes || null,
      });

      showNotification("success", "Tratamento cadastrado com sucesso!");
      router.push("/tratamentos");
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao cadastrar tratamento";
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  };

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
      value: m.id_medicamento || "",
    }));

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
            <Text style={styles.pageTitle}>Adicionar tratamento</Text>
            <Text style={styles.pageSubtitle}>
              Preencha os dados do novo tratamento
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do tratamento</Text>

          <SelectField
            label="Paciente"
            placeholder="Selecione o paciente"
            value={form.idPaciente}
            options={pacientesOptions}
            onSelect={(val) => setForm({ ...form, idPaciente: val })}
            required
          />

          <SelectField
            label="Medicamento"
            placeholder="Selecione o medicamento"
            value={form.idMedicamento}
            options={medicamentosOptions}
            onSelect={(val) => setForm({ ...form, idMedicamento: val })}
            required
          />

          <FormInput
            label="Data de Início *"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            maxLength={10}
            value={form.dataInicio}
            onChangeText={(v) =>
              setForm({ ...form, dataInicio: formatarData(v) })
            }
          />

          <FormInput
            label="Frequência *"
            placeholder="Ex: 1x ao dia, 2x ao dia"
            value={form.frequencia}
            onChangeText={(v) => setForm({ ...form, frequencia: v })}
          />

          <FormInput
            label="Data de Término"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            maxLength={10}
            value={form.dataFim}
            onChangeText={(v) => setForm({ ...form, dataFim: formatarData(v) })}
          />

          <FormInput
            label="Dosagem Prescrita"
            placeholder="Ex: 500mg, 1 comprimido"
            value={form.dosagem}
            onChangeText={(v) => setForm({ ...form, dosagem: v })}
          />

          <FormInput
            label="Motivo do Tratamento"
            placeholder="Razão do tratamento"
            value={form.motivo}
            onChangeText={(v) => setForm({ ...form, motivo: v })}
          />

          <FormInput
            label="Instruções Especiais"
            placeholder="Ex: Tomar com alimento"
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.instrucoes}
            onChangeText={(v) => setForm({ ...form, instrucoes: v })}
          />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleCadastrar}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Cadastrando..." : "Adicionar"}
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
