import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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

export default function LoginScreen(): React.ReactNode {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const fazerlogin = async () => {
    const emailLimpo = email.trim();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa) {
      showNotification("error", "Email e senha são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: emailLimpo,
        senha: senhaLimpa,
      });

      const token =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.data?.token;

      if (token) {
        await AsyncStorage.setItem("authToken", token);

        // Salvar nome e permissão do usuário
        const usuario = response.data?.usuario;
        if (usuario) {
          const nome = usuario.nome || "";
          // Formatar tipo: "COORDENADOR" → "Coordenador"
          const tipoRaw = usuario.tipo_usuario || "";
          const permissao =
            tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1).toLowerCase();
          await AsyncStorage.setItem("@app-farmacia:userName", nome);
          await AsyncStorage.setItem("@app-farmacia:userRole", permissao);
        }
      } else {
        showNotification(
          "error",
          "Token não recebido do servidor. Verifique suas credenciais.",
        );
        setLoading(false);
        return;
      }

      showNotification("success", "Login realizado com sucesso!");
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/home" as any);
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        "Erro ao fazer login. Verifique suas credenciais.";
      console.error("❌ Erro no login:", error);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Navega para a tela de recuperação de senha
    router.replace("/recuperar-senha" as any);
  };
  const handleRegister = () => {
    // Navega para a tela de cadastro
    router.replace("/cadastro" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            {/* Logo IESGO */}
            <Image
              source={require("../../../assets/images/logo-iesgo.png")}
              style={styles.logoIesgo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>FARMÁCIA</Text>
          </View>
          <Text style={styles.welcomeText}>Bem-vindo!</Text>
          <Text style={styles.instructionText}>
            Faça login para acessar o painel
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Mail
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
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
                value={senha}
                onChangeText={setSenha}
                placeholder="Senha"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text
              style={styles.forgotPasswordText}
              onPress={handleForgotPassword}
            >
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={fazerlogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <Text style={styles.registerLink} onPress={handleRegister}>
              Cadastre-se
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
    marginTop: 0,
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
    marginBottom: 8,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
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
    height: 80,
    marginBottom: 0,
    marginTop: 0,
  },
  logoLads: {
    width: 160,
    height: 60,
    marginBottom: 10,
    marginTop: 20,
  },
});
