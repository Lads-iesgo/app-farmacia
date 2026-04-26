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
import api from "../services/api";

const TRATAMENTOS_STORAGE_KEY = "@app-farmacia:tratamentos";
const ADESOES_STORAGE_KEY = "@app-farmacia:adesoes";
const MEDICAMENTOS_STORAGE_KEY = "@app-farmacia:medicamentos";
const PACIENTES_STORAGE_KEY = "@app-farmacia:pacientes";
const USER_ID_STORAGE_KEY = "@app-farmacia:userId";

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

export interface Adesao {
  id_adesao?: string;
  id_tratamento: string;
  id_paciente: string;
  data_prevista: string;
  data_tomada?: string;
  status?: string;
  observacoes?: string;
}

export interface Medicamento {
  id_medicamento?: string;
  nome_medicamento: string;
  principio_ativo: string;
  dosagem: string;
  apresentacao: string;
  fabricante: string;
  lote: string;
  data_validade: string;
  descricao: string;
  efeitos_colaterais: string;
  ativo?: boolean;
}

export interface Paciente {
  id_paciente?: string;
  id_usuario?: string;
  numero_identificacao: string;
  data_nascimento?: string;
  genero?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  historico_medico?: string;
  alergias?: string;
}

export interface Tratamento {
  id_tratamento?: string;
  id_paciente: string;
  id_medicamento: string;
  id_usuario_criador?: string;
  data_inicio: string;
  frequencia: string;
  data_fim?: string;
  dosagem_prescrita?: string;
  motivo_tratamento?: string;
  instrucoes_especiais?: string;
}

type AppContextType = {
  userId: string | null;
  setUserId: (id: string) => void;
  medicamentos: Medicamento[];
  addMedicamento: (item: Medicamento) => Promise<void>;
  updateMedicamento: (id: string, item: Medicamento) => Promise<void>;
  deleteMedicamento: (id: string) => Promise<void>;
  loadMedicamentos: () => Promise<void>;
  pacientes: Paciente[];
  addPaciente: (item: Paciente) => Promise<void>;
  updatePaciente: (id: string, item: Paciente) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;
  loadPacientes: () => Promise<void>;
  tratamentos: Tratamento[];
  addTratamento: (item: Tratamento) => Promise<void>;
  updateTratamento: (id: string, item: Tratamento) => Promise<void>;
  deleteTratamento: (id: string) => Promise<void>;
  loadTratamentos: () => Promise<void>;
  adesoes: Adesao[];
  addAdesao: (item: Adesao) => Promise<void>;
  updateAdesao: (id: string, item: Adesao) => Promise<void>;
  deleteAdesao: (id: string) => Promise<void>;
  loadAdesoes: () => Promise<void>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotification();

  const [userId, setUserIdState] = useState<string | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [adesoes, setAdesoes] = useState<Adesao[]>([]);

  // Load userId from storage on mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        if (stored) {
          setUserIdState(stored);
        }
      } catch (error) {
        console.error("Erro ao carregar userId:", error);
      }
    };
    loadUserId();
  }, []);

  const setUserId = async (id: string) => {
    setUserIdState(id);
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, id);
  };

  // Carregar todos os dados ao montar apenas se estiver autenticado
  useEffect(() => {
    const carregarSeAutenticado = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        loadMedicamentos();
        loadPacientes();
        loadTratamentos();
        loadAdesoes();
      }
    };
    carregarSeAutenticado();
  }, []);

  // Carregar medicamentos para API
  const loadMedicamentos = async () => {
    try {
      const response = await api.get("/medicamentos");
      const dados = response.data?.medicamentos || response.data?.dados || [];
      setMedicamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error);
    }
  };

  // Carregar pacientes para API
  const loadPacientes = async () => {
    try {
      const response = await api.get("/pacientes");
      const dados = response.data?.dados || response.data?.pacientes || [];
      setPacientes(dados);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  };

  // Carregar tratamentos para API
  const loadTratamentos = async () => {
    try {
      const response = await api.get("/tratamentos");
      const dados = response.data?.tratamentos || response.data?.dados || [];
      setTratamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar tratamentos:", error);
    }
  };

  // Carregar adesoes para API
  const loadAdesoes = async () => {
    try {
      const response = await api.get("/adesoes");
      const dados = response.data?.adesoes || response.data?.dados || [];
      setAdesoes(dados);
    } catch (error) {
      console.error("Erro ao carregar adesões:", error);
    }
  };

  // Medicamentos CRUD
  const addMedicamento = async (item: Medicamento) => {
    try {
      const response = await api.post("/medicamentos", item);
      setMedicamentos((prev) => [...prev, response.data]);
      showNotification("success", "Medicamento cadastrado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao cadastrar medicamento");
      throw error;
    }
  };

  const updateMedicamento = async (id: string, item: Medicamento) => {
    try {
      await api.put(`/medicamentos/${id}`, item);
      setMedicamentos((prev) =>
        prev.map((m) =>
          m.id_medicamento === id || m.id_medicamento === id.split("_")[0]
            ? item
            : m,
        ),
      );
      showNotification("success", "Medicamento atualizado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao atualizar medicamento");
      throw error;
    }
  };

  const deleteMedicamento = async (id: string) => {
    try {
      await api.delete(`/medicamentos/${id}`);
      setMedicamentos((prev) =>
        prev.filter(
          (m) =>
            m.id_medicamento !== id && m.id_medicamento !== id.split("_")[0],
        ),
      );
      showNotification("success", "Medicamento excluído com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao excluir medicamento");
      throw error;
    }
  };

  // Pacientes CRUD
  const addPaciente = async (item: Paciente) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      const payload = { ...item, id_usuario: userId };
      const response = await api.post("/pacientes", payload);
      setPacientes((prev) => [...prev, response.data]);
      showNotification("success", "Paciente cadastrado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao cadastrar paciente");
      throw error;
    }
  };

  const updatePaciente = async (id: string, item: Paciente) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      const payload = { ...item, id_usuario: userId };
      await api.put(`/pacientes/${id}`, payload);
      setPacientes((prev) =>
        prev.map((p) =>
          p.id_paciente === id || p.id_paciente === id.split("_")[0] ? item : p,
        ),
      );
      showNotification("success", "Paciente atualizado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao atualizar paciente");
      throw error;
    }
  };

  const deletePaciente = async (id: string) => {
    try {
      await api.delete(`/pacientes/${id}`);
      setPacientes((prev) =>
        prev.filter(
          (p) => p.id_paciente !== id && p.id_paciente !== id.split("_")[0],
        ),
      );
      showNotification("success", "Paciente excluído com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao excluir paciente");
      throw error;
    }
  };

  // Tratamentos CRUD
  const addTratamento = async (item: Tratamento) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      const payload = { ...item, id_usuario_criador: userId };
      const response = await api.post("/tratamentos", payload);
      setTratamentos((prev) => [...prev, response.data]);
      showNotification("success", "Tratamento cadastrado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao cadastrar tratamento");
      throw error;
    }
  };

  const updateTratamento = async (id: string, item: Tratamento) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      const payload = { ...item, id_usuario_criador: userId };
      await api.put(`/tratamentos/${id}`, payload);
      setTratamentos((prev) =>
        prev.map((t) =>
          t.id_tratamento === id || t.id_tratamento === id.split("_")[0]
            ? item
            : t,
        ),
      );
      showNotification("success", "Tratamento atualizado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao atualizar tratamento");
      throw error;
    }
  };

  const deleteTratamento = async (id: string) => {
    try {
      await api.delete(`/tratamentos/${id}`);
      setTratamentos((prev) =>
        prev.filter(
          (t) => t.id_tratamento !== id && t.id_tratamento !== id.split("_")[0],
        ),
      );
      showNotification("success", "Tratamento excluído com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao excluir tratamento");
      throw error;
    }
  };

  // Adesoes CRUD
  const addAdesao = async (item: Adesao) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      const response = await api.post("/adesoes", item);
      setAdesoes((prev) => [...prev, response.data]);
      showNotification("success", "Adesão registrada com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao registrar adesão");
      throw error;
    }
  };

  const updateAdesao = async (id: string, item: Adesao) => {
    try {
      await api.put(`/adesoes/${id}`, item);
      setAdesoes((prev) =>
        prev.map((a) =>
          a.id_adesao === id || a.id_adesao === id.split("_")[0] ? item : a,
        ),
      );
      showNotification("success", "Adesão atualizada com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao atualizar adesão");
      throw error;
    }
  };

  const deleteAdesao = async (id: string) => {
    try {
      await api.delete(`/adesoes/${id}`);
      setAdesoes((prev) =>
        prev.filter(
          (a) => a.id_adesao !== id && a.id_adesao !== id.split("_")[0],
        ),
      );
      showNotification("success", "Adesão excluída com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao excluir adesão");
      throw error;
    }
  };

  const value: AppContextType = {
    userId,
    setUserId,
    medicamentos,
    addMedicamento,
    updateMedicamento,
    deleteMedicamento,
    loadMedicamentos,
    pacientes,
    addPaciente,
    updatePaciente,
    deletePaciente,
    loadPacientes,
    tratamentos,
    addTratamento,
    updateTratamento,
    deleteTratamento,
    loadTratamentos,
    adesoes,
    addAdesao,
    updateAdesao,
    deleteAdesao,
    loadAdesoes,
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
