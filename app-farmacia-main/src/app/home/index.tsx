import { useFocusEffect } from "expo-router";
import { ClipboardCheck, Pill, Users } from "lucide-react-native";
import React, { useCallback } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardEstatistica from "../_components/CardEstatistica";
import { Colors } from "../_components/Colors";
import Header from "../_components/Header";
import { useApp } from "../_interfaces/AppContext";
import { formatarData, parseData } from "../_utils/formatters";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const [userRole, setUserRole] = React.useState("");

  const {
    pacientes,
    medicamentos,
    tratamentos,
    loadPacientes,
    loadMedicamentos,
    loadTratamentos,
  } = useApp();

  // Recarrega os dados da API sempre que a tela do dashboard ganhar foco
  useFocusEffect(
    useCallback(() => {
      const fetchRole = async () => {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const role = await AsyncStorage.getItem("@app-farmacia:userRole");
        if (role) setUserRole(role.toUpperCase());
      };
      fetchRole();

      loadPacientes();
      loadMedicamentos();
      loadTratamentos();
    }, []),
  );

  // Dados do gráfico de tratamentos por mês
  const nomesMeses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const ultimosSeisMeses = Array.from({ length: 6 }, (_, index) => {
    const data = new Date();
    data.setDate(1);
    data.setMonth(data.getMonth() - (5 - index));
    return {
      mes: data.getMonth(),
      ano: data.getFullYear(),
      label: nomesMeses[data.getMonth()],
    };
  });

  const dadosGrafico = ultimosSeisMeses.map((periodo) => {
    const total = tratamentos.filter((tratamento) => {
      const dataInicio = parseData(tratamento.data_inicio || "");
      if (!dataInicio) return false;
      return (
        dataInicio.getMonth() === periodo.mes &&
        dataInicio.getFullYear() === periodo.ano
      );
    }).length;

    return {
      label: periodo.label,
      valor: total,
    };
  });

  const maxValor = Math.max(1, ...dadosGrafico.map((item) => item.valor));

  // Medicamentos mais utilizados (baseado no uso em tratamentos)
  const usosPorMedicamento = tratamentos.reduce<Record<string, number>>(
    (acc, tratamento) => {
      const chave = String(tratamento.id_medicamento || "");
      if (!chave) return acc;
      acc[chave] = (acc[chave] || 0) + 1;
      return acc;
    },
    {},
  );

  const medicamentosMaisUsados = Object.entries(usosPorMedicamento)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([idNormalizado, totalUsos]) => {
      const medicamentoCadastro = medicamentos.find(
        (med) => String(med.id_medicamento) === idNormalizado,
      );

      return {
        nome: medicamentoCadastro?.nome_medicamento || idNormalizado,
        quantidade: `${totalUsos} uso${totalUsos > 1 ? "s" : ""}`,
        dosagem: medicamentoCadastro?.dosagem || "-",
      };
    });

  // Tratamentos recentes (ordenados por data de início)
  const tratamentosRecentes = tratamentos
    .map((tratamento, indice) => ({ tratamento, indice }))
    .sort((a, b) => {
      const dataA = parseData(a.tratamento.data_inicio || "");
      const dataB = parseData(b.tratamento.data_inicio || "");
      const timeA = dataA ? dataA.getTime() : 0;
      const timeB = dataB ? dataB.getTime() : 0;

      if (timeA === timeB) {
        return b.indice - a.indice;
      }

      return timeB - timeA;
    })
    .slice(0, 3)
    .map(({ tratamento }) => {
      const med = medicamentos.find(
        (m) => m.id_medicamento === tratamento.id_medicamento,
      );
      const pac = pacientes.find(
        (p: any) => String(p.id_paciente) === String(tratamento.id_paciente),
      );
      return {
        paciente:
          (pac as any)?.usuario?.nome ||
          (pac as any)?.nome ||
          String(tratamento.id_paciente),
        medicamento: med?.nome_medicamento || "-",
        farmaceutico: "N/A",
        data: formatarData(tratamento.data_inicio),
      };
    });

  return (
    <SafeAreaView style={styles.container}>
      <Header image={require("../../../assets/images/logo-iesgobranca.png")} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {userRole === "PACIENTE" ? (
          <View style={styles.titleSection}>
            <Text style={styles.dashboardTitle}>
              Bem-vindo ao Sistema de farmacia!
            </Text>
            <Text style={styles.dashboardSubtitle}>
              Aqui você pode acompanhar seus tratamentos e registrar suas
              adesões.
            </Text>
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <ClipboardCheck
                size={64}
                color={Colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: Colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Acesse o menu lateral para conferir os seus tratamentos
                receitados pelo médico.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Título Dashboard */}
            <View style={styles.titleSection}>
              <Text style={styles.dashboardTitle}>Dashboard</Text>
              <Text style={styles.dashboardSubtitle}>
                Bem-vindo ao sistema de gestão farmacêutica
              </Text>
            </View>

            {/* Cards de Estatísticas */}
            <CardEstatistica
              title="Total de pacientes"
              value={String(pacientes.length)}
              icon={<Users size={24} color={Colors.primary} />}
            />
            <CardEstatistica
              title="Medicamentos em estoque"
              value={String(medicamentos.length)}
              icon={<Pill size={24} color={Colors.success} />}
            />
            <CardEstatistica
              title="Tratamentos em andamento"
              value={String(tratamentos.length)}
              icon={<ClipboardCheck size={24} color={Colors.success} />}
            />

            {/* Gráfico de Tratamentos por Mês */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}> Tratamentos por Mês</Text>
              <View style={styles.chartContainer}>
                {dadosGrafico.map((item, index) => (
                  <View
                    key={`${item.label}-${index}`}
                    style={styles.barContainer}
                  >
                    <Text style={styles.barValue}>{item.valor}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (item.valor / maxValor) * 120,
                          backgroundColor: Colors.primary,
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.legendContainer}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>tratamentos</Text>
              </View>
            </View>

            {/* Medicamentos Mais Utilizados */}
            <View style={styles.listCard}>
              <Text style={styles.listTitle}>Medicamentos mais utilizados</Text>
              {medicamentosMaisUsados.map((med, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemNumber}>
                    <Text style={styles.listItemNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>{med.nome}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemQuantity}>
                      {med.quantidade}
                    </Text>
                    <Text style={styles.listItemDosage}>{med.dosagem}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tratamentos Recentes */}
            <View style={[styles.listCard, { marginBottom: 32 }]}>
              <Text style={styles.listTitle}>Tratamentos recentes</Text>
              {tratamentosRecentes.map((trat, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>{trat.paciente}</Text>
                    <Text style={styles.listItemSub}>{trat.medicamento}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemSub}>{trat.farmaceutico}</Text>
                    <Text style={styles.listItemDosage}>{trat.data}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Gráfico
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 160,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 32,
    borderRadius: 6,
    minHeight: 8,
  },
  barValue: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  barLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Lista Cards
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  listItemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listItemNumberText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 13,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  listItemSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
  listItemQuantity: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  listItemDosage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
