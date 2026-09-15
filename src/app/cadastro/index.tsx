import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react-native";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../_components/Colors";
import { useNotification } from "../_components/NotificationContext";
import api from "../services/api";

export default function RegisterScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [confirmarSenha, setConfirmarSenha] = React.useState("");
  const [mostrarSenha, setMostrarSenha] = React.useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] =
    React.useState(false);
  const [tipoUsuario, setTipoUsuario] = React.useState("ALUNO");

  const tiposDisponiveis = [
    { label: "Aluno", value: "ALUNO" },
    { label: "Professor", value: "PROFESSOR" },
    { label: "Paciente", value: "PACIENTE" },
  ];
  const [telefone, setTelefone] = React.useState("");
  const [carregando, setCarregando] = React.useState(false);

  const handleRegistro = async () => {
    // Validações
    if (!nome.trim()) {
      showNotification("error", "Nome é obrigatório");
      return;
    }

    if (!email.trim()) {
      showNotification("error", "E-mail é obrigatório");
      return;
    }

    if (!emailRegex.test(email)) {
      showNotification("error", "E-mail inválido");
      return;
    }

    if (!senha.trim()) {
      showNotification("error", "Senha é obrigatória");
      return;
    }

    if (senha.length < 6) {
      showNotification("error", "Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senha !== confirmarSenha) {
      showNotification("error", "Senhas não conferem");
      return;
    }

    try {
      setCarregando(true);
      const cadastro = {
        nome,
        email,
        senha,
        tipo_usuario: tipoUsuario,
        telefone: telefone || undefined,
      };

      const response = await api.post("/auth/registrar", cadastro);

      // Injeta o cadastro como Farmacêutico para ALUNO e PROFESSOR poderem ser
      // selecionados nos tratamentos
      if (tipoUsuario === "ALUNO" || tipoUsuario === "PROFESSOR") {
        try {
          // A rota de farmacêuticos é protegida, então fazemos um login silencioso para pegar o token provisório
          const loginResp = await api.post("/auth/login", {
            email: email.trim(),
            senha: senha,
          });
          const tempToken =
            loginResp.data?.token ||
            loginResp.data?.accessToken ||
            loginResp.data?.data?.token;

          if (tempToken) {
            await api.post(
              "/farmaceuticos",
              {
                nome: nome.trim(),
                email: email.trim(),
                telefone: telefone || "(00) 00000-0000",
                especialidade:
                  tipoUsuario === "PROFESSOR"
                    ? "Professor"
                    : "Aluno/Farmacêutico",
              },
              {
                headers: {
                  Authorization: `Bearer ${tempToken}`,
                },
              },
            );
          }
        } catch (err) {
          console.error("Falha ao registrar espelho do farmacêutico:", err);
        }
      }

      showNotification("success", "Cadastro realizado com sucesso");
      router.replace("/login" as any);
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Erro desconhecido";

      showNotification("error", mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace("/login" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo-iesgo.png")}
                style={styles.logoIesgo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>FARMÁCIA</Text>
            </View>
            <Text style={styles.welcomeText}>Crie sua conta</Text>
            <Text style={styles.instructionText}>
              Preencha os dados para se cadastrar
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <User
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome"
                  placeholderTextColor={Colors.textSecondary}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Mail
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Phone
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Telefone"
                  placeholderTextColor={Colors.textSecondary}
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Lock
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                  autoCapitalize="none"
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
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Lock
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!mostrarConfirmarSenha}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                  }
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff size={20} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                carregando && styles.loginButtonDisabled,
              ]}
              onPress={handleRegistro}
              disabled={carregando}
            >
              <Text style={styles.loginButtonText}>
                {carregando ? "CADASTRANDO..." : "CADASTRAR"}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Já tem uma conta? </Text>
              <Text style={styles.registerLink} onPress={handleGoToLogin}>
                Fazer login
              </Text>
            </View>
          </View>
          <View style={styles.logoContainer}>
            {/* Logo LADS */}
            <Image
              source={require("../../../assets/images/logo-lads.png")}
              style={styles.logoLads}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 8,
  },
  formContainer: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.text,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  logoIesgo: {
    width: 200,
    height: 50,
    marginBottom: -50,
    marginTop: 0,
  },
  logoLads: {
    width: 160,
    height: 60,
    marginBottom: 10,
    marginTop: 10,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  picker: {
    height: 56,
    color: Colors.text,
  },
  tipoContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tipoButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  tipoButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tipoButtonTextActive: {
    color: Colors.white,
  },
});
