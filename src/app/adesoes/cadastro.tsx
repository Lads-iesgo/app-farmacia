// Importação dinâmica do expo-notifications para compatibilidade com Expo Go SDK 53
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

// Tenta carregar o módulo de notificações; falha silenciosamente no Expo Go
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  // Configura o comportamento padrão das notificações quando o app está em primeiro plano
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

// ─── Utilitário: Extração de Intervalo de Horas da Frequência ─────────────────
/**
 * Interpreta um texto de frequência e retorna o intervalo em horas.
 * Suporta múltiplos formatos: "de 8 em 8", "8/8", "8 horas", "3x", "3 vezes", etc.
 * Retorna null se não for possível identificar o intervalo.
 */
const extrairHorasFrequencia = (freq: string): number | null => {
  if (!freq) return null;
  const lower = freq.toLowerCase();

  // 1. Tenta encontrar padrão "de 8 em 8" ou "8/8"
  const matchEm = lower.match(/(\d+)\s*(?:em|\/)\s*(\d+)/);
  if (matchEm) {
    const horas = parseInt(matchEm[1], 10);
    if (horas > 0) return horas;
  }

  // 2. Tenta encontrar padrão com a palavra "hora", "horas" ou "h"
  const matchHoras = lower.match(/(\d+)\s*(?:horas|hora|h\b)/);
  if (matchHoras) {
    const horas = parseInt(matchHoras[1], 10);
    if (horas > 0) return horas;
  }

  // 3. Converte "vezes ao dia" para intervalo de horas (ex: 3x = 24/3 = 8h)
  const matchVezes = lower.match(/(\d+)\s*(?:vezes|x\b)/);
  if (matchVezes) {
    const vezes = parseInt(matchVezes[1], 10);
    if (vezes > 0) return Math.floor(24 / vezes);
  }

  // 4. Textos por extenso: "uma vez ao dia", "diário", etc.
  if (
    lower.includes("uma vez") ||
    lower.includes("diario") ||
    lower.includes("diário")
  )
    return 24;
  if (lower.includes("duas vezes")) return 12;
  if (lower.includes("tres vezes") || lower.includes("três vezes")) return 8;
  if (lower.includes("quatro vezes")) return 6;

  // 5. Último recurso: pega qualquer número maior que 1 e trata como intervalo em horas.
  // Ignora "1" para não confundir com "1 comprimido"
  const matchNumero = lower.match(/\b(\d+)\b/);
  if (matchNumero) {
    const num = parseInt(matchNumero[1], 10);
    if (num > 1) return num;
  }

  return null;
};

// ─── Tela de Cadastro de Adesão ────────────────────────────────────────────────
export default function CadastroAdesaoScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();

  // Listas de dados carregadas da API para popular os selects
  const [tratamentos, setTratamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);

  // Controle de carregamento para desabilitar o botão durante requisições
  const [loading, setLoading] = useState(false);

  // Papel e id do paciente logado (preenchido automaticamente para PACIENTE)
  const [userRole, setUserRole] = useState("");
  const [meuIdPaciente, setMeuIdPaciente] = useState<number | null>(null);

  // Estado do formulário de adesão
  const [form, setForm] = useState({
    id_tratamento: "",
    data_prevista: "",
    data_tomada: "",
    hora_tomada_iso: "", // Timestamp ISO real capturado pelo botão "Agora"
  });

  // Carrega dados ao montar a tela e solicita permissão de notificação
  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;

        // Obtém o papel e o ID do usuário logado para filtrar os tratamentos
        const role =
          (await AsyncStorage.getItem("@app-farmacia:userRole")) || "";
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

        // Busca tratamentos, pacientes e medicamentos em paralelo para otimizar tempo
        const [tratResponse, pacResponse, medResponse] = await Promise.all([
          api.get("/tratamentos", { params: { skip: 0, take: 100 } }),
          api.get("/pacientes", { params: { skip: 0, take: 100 } }),
          api.get("/medicamentos", { params: { skip: 0, take: 100 } }),
        ]);

        // Normaliza as respostas, pois a API pode retornar diferentes formatos
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

        // Filtra os tratamentos de acordo com o papel do usuário
        if (role.toUpperCase() === "PACIENTE") {
          // Paciente só vê seus próprios tratamentos
          const me = pacDados.find(
            (p: any) => String(p.id_usuario) === String(idStr),
          );
          if (me) {
            setMeuIdPaciente(me.id_paciente);
            tratDados = tratDados.filter(
              (t: any) => String(t.id_paciente) === String(me.id_paciente),
            );
          } else {
            tratDados = [];
          }
        } else if (
          role.toUpperCase() === "ALUNO" ||
          role.toUpperCase() === "PROFESSOR" ||
          role.toUpperCase() === "FARMACEUTICO"
        ) {
          // Aluno/Professor/Farmêceutico só vê tratamentos que ele criou ou é responsável
          tratDados = tratDados.filter(
            (t: any) =>
              String(t.id_usuario_criador) === String(idStr) ||
              String(t.id_farmaceutico) === String(idStr),
          );
        }
        // COORDENADOR vê todos (sem filtro)

        setTratamentos(tratDados);
        setPacientes(pacDados);
        setMedicamentos(medDados);
      } catch (error) {
        showNotification("error", "Falha ao carregar dados do servidor");
      }
    };
    carregarDados();

    // Solicita permissão para enviar notificações locais ao usuário
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

  // ─── Submissão do Formulário ─────────────────────────────────────────────────
  /** Valida os campos, registra a adesão na API e agenda notificação de lembrete */
  const handleCadastrar = async () => {
    // Validação mínima dos campos obrigatórios
    if (!form.id_tratamento || !form.data_prevista || !form.data_tomada) {
      showNotification("error", "Preencha o tratamento e as datas previstas");
      return;
    }

    setLoading(true);
    try {
      // Encontra o tratamento selecionado para obter dados complementares
      const tratamentoSelecionado = tratamentos.find(
        (t) => String(t.id_tratamento) === String(form.id_tratamento),
      );

      if (!tratamentoSelecionado) {
        showNotification("error", "Tratamento inválido selecionado");
        setLoading(false);
        return;
      }

      // Prioriza o timestamp ISO capturado pelo botão "Agora"; caso contrário, converte a data digitada
      const dataTomadaISO =
        form.hora_tomada_iso || converterDataParaISO(form.data_tomada);

      // Monta o payload da adesão para enviar à API
      const response = {
        id_tratamento: Number(form.id_tratamento),
        // Se for PACIENTE, usa o id_paciente dele; caso contrário, usa o do tratamento selecionado
        id_paciente: meuIdPaciente ?? Number(tratamentoSelecionado.id_paciente),
        data_prevista: converterDataParaISO(form.data_prevista),
        data_tomada: dataTomadaISO,
        // Define o status com base na existência da data tomada
        status: dataTomadaISO ? "TOMADO" : "PENDENTE",
      };

      await api.post("/adesoes", response);

      // Agenda notificação de lembrete para a próxima dose, se houver frequência definida
      const frequenciaText = tratamentoSelecionado.frequencia || "";
      const horasFrequencia = extrairHorasFrequencia(frequenciaText);
      if (horasFrequencia && dataTomadaISO && Notifications) {
        // Calcula o momento da próxima dose somando as horas de intervalo
        const trigger = new Date(dataTomadaISO);
        trigger.setHours(trigger.getHours() + horasFrequencia);

        // Busca o nome do medicamento para exibir na notificação
        const medicamentoInfo = medicamentos.find(
          (m) =>
            String(m.id_medicamento) ===
            String(tratamentoSelecionado.id_medicamento),
        );
        const nomeMed = medicamentoInfo?.nome_medicamento || "Medicamento";

        // Notificações locais não funcionam na web, apenas mobile
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
      // Extrai a mensagem de erro mais descritiva disponível na resposta
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

  // ─── Opções do Select de Tratamentos ─────────────────────────────────────────
  // Formata os tratamentos como "Nome do Paciente - Nome do Medicamento" para exibição
  const tratamentosOptions = tratamentos.map((t: any) => {
    const paciente = pacientes.find(
      (p: any) => String(p.id_paciente) === String(t.id_paciente),
    );
    const medicamento = medicamentos.find(
      (m: any) => String(m.id_medicamento) === String(t.id_medicamento),
    );

    // Tenta obter o nome do paciente em diferentes formatos de resposta
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

  // ─── Renderização da Tela ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho da página com botão de voltar */}
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

        {/* Card principal com o formulário de adesão */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Detalhes da adesão</Text>

          {/* Seletor de tratamento (exibe paciente + medicamento) */}
          <SelectField
            label="Paciente / Medicação"
            placeholder="Selecione o tratamento"
            value={form.id_tratamento}
            options={tratamentosOptions}
            onSelect={(v: string) => setForm({ ...form, id_tratamento: v })}
          />

          {/* Campo de data prevista com máscara de formatação */}
          <FormInput
            label="Data Prevista *"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_prevista}
            onChangeText={(v) =>
              setForm({ ...form, data_prevista: formatarDataInput(v) })
            }
          />

          {/* Campo de data tomada com botão "Agora" para capturar o timestamp atual */}
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
                    hora_tomada_iso: "", // Limpa o ISO ao digitar manualmente
                  })
                }
              />
            </View>
            {/* Botão que preenche a data/hora atual automaticamente */}
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
                  hora_tomada_iso: agora.toISOString(), // Preserva o timestamp exato
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

          {/* Botões de ação: registrar e cancelar */}
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
