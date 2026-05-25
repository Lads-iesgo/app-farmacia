import { router, useLocalSearchParams } from "expo-router";
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
import { useNotification } from "../_components/NotificationContext";
import api from "../services/api";

export default function RedefinirSenha() {
  const { token } = useLocalSearchParams();
  const [novaSenha, setNovaSenha] = React.useState("");
  const [confirmarSenha, setConfirmarSenha] = React.useState("");
  const { showNotification } = useNotification();

  const handleRedefinir = async () => {
    if (!token) {
      showNotification("error", "Token inválido ou ausente. Acesse pelo link enviado no e-mail.");
      return;
    }

    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      showNotification("error", "Por favor, preencha todos os campos");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showNotification("error", "As senhas não coincidem");
      return;
    }

    try {
      await api.post("/auth/resetar-senha", { token, novaSenha });
      showNotification("success", "Senha redefinida com sucesso!");
      router.push("/login" as any);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.error ||
        "Erro ao redefinir senha. Verifique o token e tente novamente.";
      showNotification("error", mensagem);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Logo IESGO */}
          <Image
            source={require("../../../assets/images/logo-iesgo.png")}
            style={styles.logoIesgo}
            resizeMode="contain"
          />

          <Text style={styles.titulo}>Redefinir Senha</Text>
          <Text style={styles.subtitulo}>
            Digite a sua nova senha
          </Text>

          {/* Campo Nova Senha */}
          <Text style={styles.label}>Nova Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            value={novaSenha}
            onChangeText={setNovaSenha}
          />

          {/* Campo Confirmar Nova Senha */}
          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme sua nova senha"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          {/* Botão Redefinir */}
          <TouchableOpacity style={styles.botao} onPress={handleRedefinir}>
            <Text style={styles.botaoTexto}>Salvar Nova Senha</Text>
          </TouchableOpacity>

          {/* Botão Voltar */}
          <TouchableOpacity style={styles.botaoVoltar}>
            <Text
              style={styles.voltarTexto}
              onPress={() => router.push("/login" as any)}
            >
              Voltar para o login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  logoIesgo: {
    width: 160,
    height: 60,
    marginBottom: 10,
  },
  titulo: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#000",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitulo: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  label: {
    alignSelf: "flex-start",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#000",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontFamily: "Inter_400Regular",
    backgroundColor: "#F8FAFC",
  },
  botao: {
    backgroundColor: "#001F54",
    width: "100%",
    height: 55,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
  },
  botaoTexto: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  voltarTexto: {
    color: "#001F54",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginLeft: 8,
  },
});
