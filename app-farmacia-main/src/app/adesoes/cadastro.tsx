// Import dinâmico para expo-notifications
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
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
import {
  converterDataParaISO,
  formatarData,
  formatarDataInput,
} from "../_utils/formatters";
import api from "../services/api";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn("Expo Notifications ignorado no Expo Go SDK 53:", error);
}

const extrairHorasFrequencia = (freq: string): number | null => {
  if (!freq) return null;
  const lower = freq.toLowerCase();
  // 1x, 2x, etc
  if (lower.includes("1x") || lower.includes("uma vez")) return 24;
  if (lower.includes("2x") || lower.includes("duas vezes")) return 12;
  if (
    lower.includes("3x") ||
    lower.includes("tres vezes") ||
    lower.includes("três vezes")
  )
    return 8;
  if (lower.includes("4x") || lower.includes("quatro vezes")) return 6;

  const match = freq.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num > 0 && lower.includes("vezes")) {
      return 24 / num; // ex: 2 vezes ao dia -> 12
    }
    return num; // ex: 8 em 8 -> 8
  }
  return null;
};

export default function CadastroAdesaoScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [tratamentos, setTratamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id_tratamento: "",
    data_prevista: "",
    data_tomada: "",
    hora_tomada_iso: "", // Guarda o timestamp real
  });

  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const role =
          (await AsyncStorage.getItem("@app-farmacia:userRole")) || "";
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
          } catch { }
        }

        const [tratResponse, pacResponse, medResponse] = await Promise.all([
          api.get("/tratamentos", { params: { skip: 0, take: 100 } }),
          api.get("/pacientes", { params: { skip: 0, take: 100 } }),
          api.get("/medicamentos", { params: { skip: 0, take: 100 } }),
        ]);

        let tratDados =
          tratResponse.data.tratamentos ||
          tratResponse.data.dados ||
          (Array.isArray(tratResponse.data) ? tratResponse.data : []);
        const pacDados =
          pacResponse.data.pacientes ||
          pacResponse.data.dados ||
          (Array.isArray(pacResponse.data) ? pacResponse.data : []);
        const medDados =
          medResponse.data.medicamentos ||
          medResponse.data.dados ||
          (Array.isArray(medResponse.data) ? medResponse.data : []);

        if (role.toUpperCase() === "PACIENTE") {
          const me = pacDados.find(
            (p: any) => String(p.id_usuario) === String(idStr),
          );
          if (me) {
            tratDados = tratDados.filter(
              (t: any) => String(t.id_paciente) === String(me.id_paciente),
            );
          } else {
            tratDados = [];
          }
        } else if (
          role.toUpperCase() === "ALUNO" ||
          role.toUpperCase() === "FARMACEUTICO"
        ) {
          tratDados = tratDados.filter(
            (t: any) =>
              String(t.id_usuario_criador) === String(idStr) ||
              String(t.id_farmaceutico) === String(idStr),
          );
        }

        setTratamentos(tratDados);
        setPacientes(pacDados);
        setMedicamentos(medDados);
      } catch (error) {
        showNotification("error", "Falha ao carregar dados do servidor");
      }
    };
    carregarDados();

    // Solicitar permissões de notificação
    const requestPermissions = async () => {
      if (!Notifications) return;
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          showNotification(
            "error",
            "Permissão para notificações não concedida.",
          );
        }
      } catch (error) {
        console.warn("Erro ao requestPermissionsAsync:", error);
      }
    };
    requestPermissions();
  }, []);

  const handleCadastrar = async () => {
    if (!form.id_tratamento || !form.data_prevista || !form.data_tomada) {
      showNotification("error", "Preencha o tratamento e as datas previstas");
      return;
    }

    setLoading(true);
    try {
      const tratamentoSelecionado = tratamentos.find(
        (t) => String(t.id_tratamento) === String(form.id_tratamento),
      );

      if (!tratamentoSelecionado) {
        showNotification("error", "Tratamento inválido selecionado");
        setLoading(false);
        return;
      }

      const dataTomadaISO =
        form.hora_tomada_iso || converterDataParaISO(form.data_tomada);

      const response = {
        id_tratamento: Number(form.id_tratamento),
        id_paciente: Number(tratamentoSelecionado.id_paciente),
        data_prevista: converterDataParaISO(form.data_prevista),
        data_tomada: dataTomadaISO,
      };

      await api.post("/adesoes", response);

      // Agendar notificação se houver frequência
      const frequenciaText = tratamentoSelecionado.frequencia || "";
      const horasFrequencia = extrairHorasFrequencia(frequenciaText);
      if (horasFrequencia && dataTomadaISO && Notifications) {
        const trigger = new Date(dataTomadaISO);
        trigger.setHours(trigger.getHours() + horasFrequencia);

        const medicamentoInfo = medicamentos.find(
          (m) =>
            String(m.id_medicamento) ===
            String(tratamentoSelecionado.id_medicamento),
        );
        const nomeMed = medicamentoInfo?.nome_medicamento || "Medicamento";

        if (Platform.OS !== "web") {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Hora do Tratamento! 💊",
              body: `Chegou a hora de tomar: ${nomeMed}.`,
              sound: true,
            },
            trigger: {
              date: trigger,
              channelId: "default",
            },
          });
        }
      }

      showNotification("success", "Adesão registrada com sucesso!");
      router.push("/adesoes" as any);
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao registrar adesão";
      console.error("❌ Erro:", mensagem);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  };

  const tratamentosOptions = tratamentos.map((t: any) => {
    const paciente = pacientes.find(
      (p: any) => String(p.id_paciente) === String(t.id_paciente),
    );
    const medicamento = medicamentos.find(
      (m: any) => String(m.id_medicamento) === String(t.id_medicamento),
    );

    const pacienteNome =
      (paciente as any)?.usuario?.nome ||
      (paciente as any)?.nome ||
      `Paciente #${t.id_paciente}`;
    const medicamentoNome =
      (medicamento as any)?.nome_medicamento ||
      `Medicamento #${t.id_medicamento}`;

    return {
      label: `${pacienteNome} - ${medicamentoNome}`,
      value: String(t.id_tratamento),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.push("/adesoes" as any)}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Registrar adesão</Text>
            <Text style={styles.pageSubtitle}>
              Registre o agendamento de um medicamento
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Detalhes da adesão</Text>

          <SelectField
            label="Tratamento *"
            placeholder="Selecione o tratamento"
            value={form.id_tratamento}
            options={tratamentosOptions}
            onSelect={(v: string) => setForm({ ...form, id_tratamento: v })}
          />

          <FormInput
            label="Data Prevista *"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_prevista}
            onChangeText={(v) =>
              setForm({ ...form, data_prevista: formatarDataInput(v) })
            }
          />

          <View style={styles.dataTomadaContainer}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Data Tomada *"
                placeholder="dd/mm/aaaa ou Hora Atual"
                keyboardType="numeric"
                value={form.data_tomada}
                onChangeText={(v) =>
                  setForm({
                    ...form,
                    data_tomada: formatarDataInput(v),
                    hora_tomada_iso: "",
                  })
                }
              />
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                const agora = new Date();
                const diaMesAno = formatarData(agora) || "";
                const hora = String(agora.getHours()).padStart(2, "0");
                const min = String(agora.getMinutes()).padStart(2, "0");
                setForm({
                  ...form,
                  data_tomada: `${diaMesAno} ${hora}:${min}`,
                  hora_tomada_iso: agora.toISOString(),
                });
                showNotification(
                  "success",
                  "Hora atual capturada com sucesso!",
                );
              }}
            >
              <Text style={styles.timeButtonText}>Agora</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleCadastrar}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Registrando..." : "Registrar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push("/adesoes" as any)}
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
  buttonDisabled: {
    opacity: 0.6,
  },
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
  dataTomadaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  timeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    marginTop: 6,
    alignSelf: "center",
    height: 52,
    justifyContent: "center",
  },
  timeButtonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
});
