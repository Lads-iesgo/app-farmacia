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
import RNPickerSelect from "react-native-picker-select"; // Importação do Picker
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../_components/Colors";
import FormInput from "../_components/FormInput";
import Header from "../_components/Header";
import { useNotification } from "../_components/NotificationContext";
import api from "../services/api";

export default function CadastroMedicamentoScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    dosagem: "",
    apresentacao: "", // Este valor será controlado pelo Picker
    descricao: "",
  });

  // Opções da Dropbox
  const opcoesApresentacao = [
    { label: "Comprimido", value: "Comprimido" },
    { label: "Cápsula", value: "Cápsula" },
    { label: "Xarope", value: "Xarope" },
    { label: "Gotas", value: "Gotas" },
    { label: "Injetável", value: "Injetável" },
    { label: "Pomada/Creme", value: "Pomada" },
  ];

  const handleCadastrar = async () => {
    if (!form.nome.trim() || !form.dosagem.trim() || !form.apresentacao) {
      showNotification("error", "Preencha nome, dosagem e apresentação");
      return;
    }

    setLoading(true);
    try {
      await api.post("/medicamentos", {
        nome_medicamento: form.nome.trim(),
        dosagem: form.dosagem.trim(),
        apresentacao: form.apresentacao,
        descricao: form.descricao.trim() || null,
      });

      showNotification("success", "Medicamento cadastrado com sucesso!");
      router.push("/medicamentos");
    } catch {
      showNotification("error", "Falha ao cadastrar medicamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.push("/medicamentos")} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Cadastrar medicamento</Text>
            <Text style={styles.pageSubtitle}>Preencha os dados do novo medicamento</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do medicamento</Text>

          <FormInput
            label="Nome do medicamento"
            placeholder="Ex: Paracetamol"
            value={form.nome}
            onChangeText={(v) => setForm({ ...form, nome: v })}
          />

          <FormInput
            label="Dosagem"
            placeholder="Ex: 500mg"
            value={form.dosagem}
            onChangeText={(v) => setForm({ ...form, dosagem: v })}
          />

          {/* DROPBOX DE APRESENTAÇÃO */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Apresentação</Text>
            <RNPickerSelect
              onValueChange={(value) => setForm({ ...form, apresentacao: value })}
              items={opcoesApresentacao}
              placeholder={{ label: "Selecione a apresentação...", value: null }}
              value={form.apresentacao}
              style={pickerSelectStyles}
            />
          </View>

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
              onPress={handleCadastrar}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>{loading ? "Cadastrando..." : "Cadastrar"}</Text>
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

// Estilização específica para o Picker
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15,
  },
});

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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 5,
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