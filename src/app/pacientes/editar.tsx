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
import api from "../services/api";

import {
  converterDataParaISO,
  formatarCpf,
  formatarDataInput,
  formatarTelefone,
  validarEmail,
} from "../_utils/formatters";

export default function EditarPacienteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    numero_identificacao: "",
    data_nascimento: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  const carregarPaciente = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/pacientes/${id}`);
      const paciente =
        response.data?.paciente || response.data?.data || response.data;

      if (!paciente || typeof paciente !== "object") {
        showNotification("error", "Paciente não encontrado ou dados inválidos");
        router.back();
        return;
      }

      setForm({
        nome: paciente.usuario?.nome || paciente.nome || "",
        numero_identificacao: paciente.numero_identificacao || "",
        data_nascimento: paciente.data_nascimento || "",
        email: paciente.email || "",
        telefone: paciente.telefone || "",
        endereco: paciente.endereco || "",
      });
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao carregar paciente";
      showNotification("error", mensagem);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPaciente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAtualizar = async () => {
    if (!form.nome || !form.numero_identificacao || !form.data_nascimento) {
      showNotification(
        "error",
        "Preencha pelo menos Nome, CPF e Data de Nascimento",
      );
      return;
    }

    if (form.email && !validarEmail(form.email)) {
      showNotification(
        "error",
        "E-mail inválido. Use o formato exemplo@dominio.com",
      );
      return;
    }

    if (!id || typeof id !== "string") return;

    try {
      setLoading(true);
      await api.put(`/pacientes/${id}`, {
        nome: form.nome,
        numero_identificacao: form.numero_identificacao,
        data_nascimento: converterDataParaISO(form.data_nascimento),
        email: form.email || null,
        telefone: form.telefone || null,
        endereco: form.endereco || null,
      });
      showNotification("success", "Paciente atualizado com sucesso!");
      router.push("/pacientes");
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao atualizar paciente";
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
            onPress={() => router.push("/pacientes")}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Editar paciente</Text>
            <Text style={styles.pageSubtitle}>
              Atualize as informações do paciente
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do paciente</Text>

          <FormInput
            label="Nome completo"
            placeholder="Digite o nome completo"
            value={form.nome}
            onChangeText={(v) => setForm({ ...form, nome: v })}
          />

          <FormInput
            label="CPF"
            placeholder="000.000.000-00"
            keyboardType="numeric"
            value={form.numero_identificacao}
            onChangeText={(v) =>
              setForm({ ...form, numero_identificacao: formatarCpf(v) })
            }
          />

          <FormInput
            label="Data de nascimento"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.data_nascimento}
            onChangeText={(v) =>
              setForm({ ...form, data_nascimento: formatarDataInput(v) })
            }
          />

          <FormInput
            label="E-mail"
            placeholder="email@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />

          <FormInput
            label="Telefone"
            placeholder="(11) 98765-4321"
            keyboardType="phone-pad"
            value={form.telefone}
            onChangeText={(v) =>
              setForm({ ...form, telefone: formatarTelefone(v) })
            }
          />

          <FormInput
            label="Endereço completo"
            placeholder="Rua, número, bairro, cidade, estado"
            value={form.endereco}
            onChangeText={(v) => setForm({ ...form, endereco: v })}
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
              onPress={() => router.push("/pacientes")}
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
