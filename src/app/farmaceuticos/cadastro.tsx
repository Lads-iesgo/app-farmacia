import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { formatarTelefone } from "../_utils/formatters";
import api from "../services/api";

export default function CadastroFarmaceuticoScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    especialidade: "",
    senha: "",
    confirmarSenha: "",
  });

  const handleCadastrar = async () => {
    if (!form.nome || !form.email || !form.telefone) {
      showNotification("error", "Preencha nome, email e telefone");
      return;
    }

    if (!form.senha) {
      showNotification("error", "Preencha a senha do farmacêutico");
      return;
    }

    if (form.senha.length < 6) {
      showNotification("error", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      showNotification("error", "As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      await api.post("/farmaceuticos", {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        especialidade: form.especialidade || null,
        senha: form.senha,
      });

      showNotification("success", "Farmacêutico cadastrado com sucesso!");
      router.push("/farmaceuticos");
    } catch {
      showNotification("error", "Falha ao cadastrar farmacêutico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <TouchableOpacity
              onPress={() => router.push("/farmaceuticos")}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>Cadastrar farmacêutico</Text>
              <Text style={styles.pageSubtitle}>
                Preencha os dados do profissional
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>
              Informações do farmacêutico
            </Text>

            <FormInput
              label="Nome *"
              placeholder="Nome completo"
              value={form.nome}
              onChangeText={(v) => setForm({ ...form, nome: v })}
            />

            <FormInput
              label="Telefone *"
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              value={form.telefone}
              onChangeText={(v) =>
                setForm({ ...form, telefone: formatarTelefone(v) })
              }
            />

            <FormInput
              label="Email *"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
            />
            <View style={styles.passwordWrapper}>
              <FormInput
                label="Senha *"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                value={form.senha}
                onChangeText={(v) => setForm({ ...form, senha: v })}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <FormInput
                label="Confirmar senha *"
                placeholder="Repita a senha"
                secureTextEntry={!mostrarConfirmarSenha}
                autoCapitalize="none"
                value={form.confirmarSenha}
                onChangeText={(v) => setForm({ ...form, confirmarSenha: v })}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCadastrar}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.push("/farmaceuticos")}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    bottom: 30,
    padding: 4,
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
});
