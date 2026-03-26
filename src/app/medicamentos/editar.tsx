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

export default function EditarMedicamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    dosagem: "",
    apresentacao: "",
    descricao: "",
  });

  useEffect(() => {
    if (id) {
      carregarMedicamento();
    }
  }, [id]);

  const carregarMedicamento = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medicamentos/${id}`);
      const med = response.data.medicamento || response.data;
      setForm({
        nome: med.nome_medicamento || "",
        dosagem: med.dosagem || "",
        apresentacao: med.apresentacao || "",
        descricao: med.descricao || "",
      });
    } catch {
      showNotification("error", "Medicamento não encontrado");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizar = async () => {
    if (!form.nome || !form.dosagem || !form.apresentacao) {
      showNotification("error", "Preencha nome, dosagem e apresentação");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/medicamentos/${id}`, {
        nome_medicamento: form.nome,
        dosagem: form.dosagem,
        apresentacao: form.apresentacao,
        descricao: form.descricao || null,
      });
      showNotification("success", "Medicamento atualizado com sucesso!");
      router.push("/medicamentos");
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro || error.message || "Falha ao atualizar";
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
            onPress={() => router.push("/medicamentos")}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Editar medicamento</Text>
            <Text style={styles.pageSubtitle}>
              Atualize as informações do medicamento
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>
            Informações do medicamento
          </Text>

          <FormInput
            label="Nome do medicamento *"
            placeholder="Ex: Paracetamol 500mg"
            value={form.nome}
            onChangeText={(v) => setForm({ ...form, nome: v })}
          />

          <FormInput
            label="Dosagem *"
            placeholder="Ex: 500mg"
            value={form.dosagem}
            onChangeText={(v) => setForm({ ...form, dosagem: v })}
          />

          <FormInput
            label="Apresentação *"
            placeholder="Ex: Comprimido, Cápsula, Xarope"
            value={form.apresentacao}
            onChangeText={(v) => setForm({ ...form, apresentacao: v })}
          />

          <FormInput
            label="Descrição"
            placeholder="Descreva o medicamento"
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.descricao}
            onChangeText={(v) => setForm({ ...form, descricao: v })}
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
              onPress={() => router.push("/medicamentos")}
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
