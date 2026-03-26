import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../_components/Colors";
import FormInput from "../_components/FormInput";
import Header from "../_components/Header";
import { useNotification } from "../_components/NotificationContext";
import SelectField from "../_components/Select";
import {
  converterDataParaISO,
  formatarCpf,
  formatarDataInput,
} from "../_utils/formatters";
import api from "../services/api";

export default function CadastroPacienteScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const decodificarToken = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  };

  const [form, setForm] = useState({
    nome: "",
    numeroIdentificacao: "",
    dataNascimento: "",
    genero: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    historicoMedico: "",
    alergias: "",
  });

  const handleCadastrar = async () => {
    if (!form.nome || !form.numeroIdentificacao) {
      showNotification("error", "Preencha nome e CPF");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        showNotification("error", "Token não encontrado. Faça login novamente");
        setLoading(false);
        return;
      }

      const decoded = decodificarToken(token);
      const idUsuario = decoded?.id || decoded?.id_usuario || decoded?.sub;

      if (!idUsuario) {
        showNotification("error", "ID do usuário não encontrado no token");
        setLoading(false);
        return;
      }

      await api.post("/pacientes", {
        nome: form.nome,
        numero_identificacao: form.numeroIdentificacao,
        data_nascimento: converterDataParaISO(form.dataNascimento),
        genero: form.genero || null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        cep: form.cep || null,
        historico_medico: form.historicoMedico || null,
        alergias: form.alergias || null,
      });

      showNotification("success", "Paciente cadastrado com sucesso!");
      router.push("/pacientes");
    } catch (error: any) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Falha ao cadastrar paciente";
      console.error("❌ Erro:", mensagem);
      showNotification("error", mensagem);
    } finally {
      setLoading(false);
    }
  };

  const generoOptions = [
    { label: "Masculino", value: "M" },
    { label: "Feminino", value: "F" },
    { label: "Outro", value: "O" },
  ];

  const estadosOptions = [
    { label: "Acre", value: "AC" },
    { label: "Alagoas", value: "AL" },
    { label: "Amapá", value: "AP" },
    { label: "Amazonas", value: "AM" },
    { label: "Bahia", value: "BA" },
    { label: "Ceará", value: "CE" },
    { label: "Distrito Federal", value: "DF" },
    { label: "Espírito Santo", value: "ES" },
    { label: "Goiás", value: "GO" },
    { label: "Maranhão", value: "MA" },
    { label: "Mato Grosso", value: "MT" },
    { label: "Mato Grosso do Sul", value: "MS" },
    { label: "Minas Gerais", value: "MG" },
    { label: "Pará", value: "PA" },
    { label: "Paraíba", value: "PB" },
    { label: "Paraná", value: "PR" },
    { label: "Pernambuco", value: "PE" },
    { label: "Piauí", value: "PI" },
    { label: "Rio de Janeiro", value: "RJ" },
    { label: "Rio Grande do Norte", value: "RN" },
    { label: "Rio Grande do Sul", value: "RS" },
    { label: "Rondônia", value: "RO" },
    { label: "Roraima", value: "RR" },
    { label: "Santa Catarina", value: "SC" },
    { label: "São Paulo", value: "SP" },
    { label: "Sergipe", value: "SE" },
    { label: "Tocantins", value: "TO" },
  ];

  const formatarCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    return numeros.replace(/(\d{5})(\d)/, "$1-$2");
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
            <Text style={styles.pageTitle}>Cadastrar paciente</Text>
            <Text style={styles.pageSubtitle}>
              Preencha os dados do novo paciente
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Informações do paciente</Text>

          <FormInput
            label="Nome"
            placeholder="Nome completo"
            value={form.nome}
            onChangeText={(v) => setForm({ ...form, nome: v })}
          />

          <FormInput
            label="CPF *"
            placeholder="000.000.000-00"
            keyboardType="numeric"
            value={form.numeroIdentificacao}
            onChangeText={(v) =>
              setForm({ ...form, numeroIdentificacao: formatarCpf(v) })
            }
          />

          <FormInput
            label="Data de Nascimento"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
            value={form.dataNascimento}
            onChangeText={(v) =>
              setForm({ ...form, dataNascimento: formatarDataInput(v) })
            }
          />

          <SelectField
            label="Gênero"
            placeholder="Selecione o gênero"
            value={form.genero}
            options={generoOptions}
            onSelect={(v: string) => setForm({ ...form, genero: v })}
          />

          <FormInput
            label="Endereço"
            placeholder="Rua, número, bairro"
            value={form.endereco}
            onChangeText={(v) => setForm({ ...form, endereco: v })}
          />

          <FormInput
            label="Cidade"
            placeholder="Sua cidade"
            value={form.cidade}
            onChangeText={(v) => setForm({ ...form, cidade: v })}
          />

          <SelectField
            label="Estado"
            placeholder="Selecione o estado"
            value={form.estado}
            options={estadosOptions}
            onSelect={(v: string) => setForm({ ...form, estado: v })}
          />

          <FormInput
            label="CEP"
            placeholder="00000-000"
            keyboardType="numeric"
            value={form.cep}
            onChangeText={(v) => setForm({ ...form, cep: formatarCep(v) })}
          />

          <FormInput
            label="Histórico Médico"
            placeholder="Doenças anteriores, etc."
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.historicoMedico}
            onChangeText={(v) => setForm({ ...form, historicoMedico: v })}
          />

          <FormInput
            label="Alergias"
            placeholder="Descreva alergias conhecidas"
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            value={form.alergias}
            onChangeText={(v) => setForm({ ...form, alergias: v })}
          />

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
