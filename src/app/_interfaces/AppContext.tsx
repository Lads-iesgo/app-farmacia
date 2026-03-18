import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { TextInputProps } from "react-native";
import { useNotification } from "../_components/NotificationContext";

const TRATAMENTOS_STORAGE_KEY = "@app-farmacia:tratamentos";
const FARMACEUTICOS_STORAGE_KEY = "@app-farmacia:farmaceuticos";
const MEDICAMENTOS_STORAGE_KEY = "@app-farmacia:medicamentos";
const PACIENTES_STORAGE_KEY = "@app-farmacia:pacientes";

export interface HeaderProps {
  title?: string;
  image?: string;
  logoImage?: string;
}

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export interface MenuProps {
  onDashboardPress?: () => void;
  onFarmaceuticosPress?: () => void;
  onPacientesPress?: () => void;
  onMedicamentosPress?: () => void;
  onTratamentosPress?: () => void;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export interface HeaderProps {
  title?: string;
  image?: string;
  logoImage?: string;
}

export interface Farmaceutico {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
}

export interface Medicamento {
  id: string;
  nome: string;
  tipo: string;
  quantidade: string;
  dosagem: string;
  descricao: string;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface Tratamento {
  id: string;
  paciente: string;
  medicamento: string;
  farmaceutico: string;
  dataInicio: string;
  dataTermino: string;
  posologia: string;
  periodo: string;
  observacoes: string;
}

type AppContextType = {
  farmaceuticos: Farmaceutico[];
  addFarmaceutico: (item: Omit<Farmaceutico, "id">) => void;
  updateFarmaceutico: (id: string, item: Omit<Farmaceutico, "id">) => void;
  deleteFarmaceutico: (id: string) => void;
  medicamentos: Medicamento[];
  addMedicamento: (item: Omit<Medicamento, "id">) => void;
  updateMedicamento: (id: string, item: Omit<Medicamento, "id">) => void;
  deleteMedicamento: (id: string) => void;
  pacientes: Paciente[];
  addPaciente: (item: Omit<Paciente, "id">) => void;
  updatePaciente: (id: string, item: Omit<Paciente, "id">) => void;
  deletePaciente: (id: string) => void;
  tratamentos: Tratamento[];
  addTratamento: (item: Omit<Tratamento, "id">) => void;
  updateTratamento: (id: string, item: Omit<Tratamento, "id">) => void;
  deleteTratamento: (id: string) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotification();

  const [farmaceuticos, setFarmaceuticos] = useState<Farmaceutico[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [isFarmaceuticosLoaded, setIsFarmaceuticosLoaded] = useState(false);
  const [isMedicamentosLoaded, setIsMedicamentosLoaded] = useState(false);
  const [isPacientesLoaded, setIsPacientesLoaded] = useState(false);
  const [isTratamentosLoaded, setIsTratamentosLoaded] = useState(false);

  useEffect(() => {
    const carregarFarmaceuticos = async () => {
      try {
        const farmaceuticosSalvos = await AsyncStorage.getItem(
          FARMACEUTICOS_STORAGE_KEY,
        );

        if (farmaceuticosSalvos) {
          const parsed = JSON.parse(farmaceuticosSalvos);
          if (Array.isArray(parsed)) {
            setFarmaceuticos(parsed);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar farmacêuticos", error);
      } finally {
        setIsFarmaceuticosLoaded(true);
      }
    };

    carregarFarmaceuticos();
  }, []);

  useEffect(() => {
    if (!isFarmaceuticosLoaded) return;

    const salvarFarmaceuticos = async () => {
      try {
        await AsyncStorage.setItem(
          FARMACEUTICOS_STORAGE_KEY,
          JSON.stringify(farmaceuticos),
        );
      } catch (error) {
        console.error("Erro ao salvar farmacêuticos", error);
      }
    };

    salvarFarmaceuticos();
  }, [farmaceuticos, isFarmaceuticosLoaded]);

  useEffect(() => {
    const carregarMedicamentos = async () => {
      try {
        const medicamentosSalvos = await AsyncStorage.getItem(
          MEDICAMENTOS_STORAGE_KEY,
        );

        if (medicamentosSalvos) {
          const parsed = JSON.parse(medicamentosSalvos);
          if (Array.isArray(parsed)) {
            setMedicamentos(parsed);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar medicamentos", error);
      } finally {
        setIsMedicamentosLoaded(true);
      }
    };

    carregarMedicamentos();
  }, []);

  useEffect(() => {
    if (!isMedicamentosLoaded) return;

    const salvarMedicamentos = async () => {
      try {
        await AsyncStorage.setItem(
          MEDICAMENTOS_STORAGE_KEY,
          JSON.stringify(medicamentos),
        );
      } catch (error) {
        console.error("Erro ao salvar medicamentos", error);
      }
    };

    salvarMedicamentos();
  }, [medicamentos, isMedicamentosLoaded]);

  useEffect(() => {
    const carregarPacientes = async () => {
      try {
        const pacientesSalvos = await AsyncStorage.getItem(
          PACIENTES_STORAGE_KEY,
        );

        if (pacientesSalvos) {
          const parsed = JSON.parse(pacientesSalvos);
          if (Array.isArray(parsed)) {
            setPacientes(parsed);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar pacientes", error);
      } finally {
        setIsPacientesLoaded(true);
      }
    };

    carregarPacientes();
  }, []);

  useEffect(() => {
    if (!isPacientesLoaded) return;

    const salvarPacientes = async () => {
      try {
        await AsyncStorage.setItem(
          PACIENTES_STORAGE_KEY,
          JSON.stringify(pacientes),
        );
      } catch (error) {
        console.error("Erro ao salvar pacientes", error);
      }
    };

    salvarPacientes();
  }, [pacientes, isPacientesLoaded]);

  useEffect(() => {
    const carregarTratamentos = async () => {
      try {
        const tratamentosSalvos = await AsyncStorage.getItem(
          TRATAMENTOS_STORAGE_KEY,
        );

        if (tratamentosSalvos) {
          const parsed = JSON.parse(tratamentosSalvos);
          if (Array.isArray(parsed)) {
            setTratamentos(parsed);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar tratamentos", error);
      } finally {
        setIsTratamentosLoaded(true);
      }
    };

    carregarTratamentos();
  }, []);

  useEffect(() => {
    if (!isTratamentosLoaded) return;

    const salvarTratamentos = async () => {
      try {
        await AsyncStorage.setItem(
          TRATAMENTOS_STORAGE_KEY,
          JSON.stringify(tratamentos),
        );
      } catch (error) {
        console.error("Erro ao salvar tratamentos", error);
      }
    };

    salvarTratamentos();
  }, [tratamentos, isTratamentosLoaded]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addFarmaceutico = (item: Omit<Farmaceutico, "id">) => {
    setFarmaceuticos((prev) => [...prev, { ...item, id: generateId() }]);
    showNotification("success", "Farmacêutico cadastrado com sucesso");
  };

  const updateFarmaceutico = (id: string, item: Omit<Farmaceutico, "id">) => {
    setFarmaceuticos((prev) =>
      prev.map((f) => (f.id === id ? { ...item, id } : f)),
    );
    showNotification("success", "Farmacêutico editado com sucesso");
  };

  const deleteFarmaceutico = (id: string) => {
    setFarmaceuticos((prev) => prev.filter((f) => f.id !== id));
    showNotification("success", "Farmacêutico excluído com sucesso");
  };

  const addMedicamento = (item: Omit<Medicamento, "id">) => {
    setMedicamentos((prev) => [...prev, { ...item, id: generateId() }]);
    showNotification("success", "Medicamento cadastrado com sucesso");
  };

  const updateMedicamento = (id: string, item: Omit<Medicamento, "id">) => {
    setMedicamentos((prev) =>
      prev.map((m) => (m.id === id ? { ...item, id } : m)),
    );
    showNotification("success", "Medicamento editado com sucesso");
  };

  const deleteMedicamento = (id: string) => {
    setMedicamentos((prev) => prev.filter((m) => m.id !== id));
    showNotification("success", "Medicamento excluído com sucesso");
  };

  const addPaciente = (item: Omit<Paciente, "id">) => {
    setPacientes((prev) => [...prev, { ...item, id: generateId() }]);
    showNotification("success", "Paciente cadastrado com sucesso");
  };

  const updatePaciente = (id: string, item: Omit<Paciente, "id">) => {
    setPacientes((prev) =>
      prev.map((p) => (p.id === id ? { ...item, id } : p)),
    );
    showNotification("success", "Paciente editado com sucesso");
  };

  const deletePaciente = (id: string) => {
    setPacientes((prev) => prev.filter((p) => p.id !== id));
    showNotification("success", "Paciente excluído com sucesso");
  };

  const addTratamento = (item: Omit<Tratamento, "id">) => {
    setTratamentos((prev) => [...prev, { ...item, id: generateId() }]);
    showNotification("success", "Tratamento cadastrado com sucesso");
  };

  const updateTratamento = (id: string, item: Omit<Tratamento, "id">) => {
    setTratamentos((prev) =>
      prev.map((t) => (t.id === id ? { ...item, id } : t)),
    );
    showNotification("success", "Tratamento editado com sucesso");
  };

  const deleteTratamento = (id: string) => {
    setTratamentos((prev) => prev.filter((t) => t.id !== id));
    showNotification("success", "Tratamento excluído com sucesso");
  };

  const value: AppContextType = {
    farmaceuticos,
    addFarmaceutico,
    updateFarmaceutico,
    deleteFarmaceutico,
    medicamentos,
    addMedicamento,
    updateMedicamento,
    deleteMedicamento,
    pacientes,
    addPaciente,
    updatePaciente,
    deletePaciente,
    tratamentos,
    addTratamento,
    updateTratamento,
    deleteTratamento,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export default AppProvider;
