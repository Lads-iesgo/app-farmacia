import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Navbar from "./_components/Navbar";
import NavbarProvider, { useNavbar } from "./_components/NavbarContext";
import ToastContainer from "./_components/Notification";
import { AppProvider } from "./_interfaces/AppContext";

import { NotificationProvider } from "./_components/NotificationContext";

// Rotas que não precisam de autenticação
const ROTAS_PUBLICAS = [
  "login",
  "cadastro",
  "recuperar-senha",
  "redefinir-senha",
  "index",
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const rotaAtual = segments[0] || "index";
        const ePublica = ROTAS_PUBLICAS.includes(rotaAtual);

        if (!token && !ePublica) {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setVerificando(false);
      }
    };
    verificarAuth();
  }, [segments]);

  if (verificando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { isOpen, close } = useNavbar();

  return (
    <View style={styles.container}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
        <Navbar visible={isOpen} onClose={close} />
        <ToastContainer />
      </AuthGuard>
    </View>
  );
}

export default function RootLayout() {
  return (
    <NotificationProvider>
      <AppProvider>
        <NavbarProvider>
          <AppContent />
        </NavbarProvider>
      </AppProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
