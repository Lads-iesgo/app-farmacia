// Importações de armazenamento local e dependências do React
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

// ─── Chaves de armazenamento local (AsyncStorage) ─────────────────────────────
// Cada constante representa a chave usada para persistir dados no dispositivo
const TRATAMENTOS_STORAGE_KEY = "@app-farmacia:tratamentos";
const ADESOES_STORAGE_KEY = "@app-farmacia:adesoes";
const MEDICAMENTOS_STORAGE_KEY = "@app-farmacia:medicamentos";
const PACIENTES_STORAGE_KEY = "@app-farmacia:pacientes";
const USER_ID_STORAGE_KEY = "@app-farmacia:userId";

// ─── Interfaces de Props dos Componentes Reutilizáveis ────────────────────────

/** Props do cabeçalho da aplicação */
export interface HeaderProps {
  title?: string;
  image?: string;
  logoImage?: string;
}

/** Props do botão genérico reutilizável */
export interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

/** Props do campo de entrada de texto, estende TextInputProps do React Native */
export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/** Props do menu de navegação lateral */
export interface MenuProps {
  onDashboardPress?: () => void;
  onFarmaceuticosPress?: () => void;
  onPacientesPress?: () => void;
  onMedicamentosPress?: () => void;
  onTratamentosPress?: () => void;
}

// ─── Interfaces de Domínio (Entidades do Sistema) ────────────────────────────

/** Representa uma adesão ao medicamento por parte do paciente */
export interface Adesao {
  id_adesao?: string;
  id_tratamento: string;
  id_paciente: string;
  /** Data em que a dose estava prevista para ser tomada */
  data_prevista: string;
  /** Data real em que a dose foi tomada (opcional) */
  data_tomada?: string;
  /** Status da adesão: "tomado", "pendente", etc. */
  status?: string;
  observacoes?: string;
}

/** Representa um medicamento cadastrado no sistema */
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
  /** Indica se o medicamento está ativo no sistema */
  ativo?: boolean;
}

/** Representa um paciente cadastrado no sistema */
export interface Paciente {
  id_paciente?: string;
  /** ID do usuário vinculado ao paciente */
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

/** Representa um tratamento médico prescrito a um paciente */
export interface Tratamento {
  id_tratamento?: string;
  id_paciente: string;
  id_medicamento: string;
  /** ID do usuário (farmacêutico/aluno) que criou o tratamento */
  id_usuario_criador?: string;
  data_inicio: string;
  /** Frequência de uso do medicamento (ex: "de 8 em 8 horas") */
  frequencia: string;
  data_fim?: string;
  dosagem_prescrita?: string;
  motivo_tratamento?: string;
  instrucoes_especiais?: string;
}

// ─── Tipagem do Contexto Global da Aplicação ─────────────────────────────────
// Define todas as propriedades e funções disponíveis globalmente via Context API
type AppContextType = {
  userId: string | null;
  setUserId: (id: string) => void;
  // Estado e operações de medicamentos
  medicamentos: Medicamento[];
  addMedicamento: (item: Medicamento) => Promise<void>;
  updateMedicamento: (id: string, item: Medicamento) => Promise<void>;
  deleteMedicamento: (id: string) => Promise<void>;
  loadMedicamentos: () => Promise<void>;
  // Estado e operações de pacientes
  pacientes: Paciente[];
  addPaciente: (item: Paciente) => Promise<void>;
  updatePaciente: (id: string, item: Paciente) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;
  loadPacientes: () => Promise<void>;
  // Estado e operações de tratamentos
  tratamentos: Tratamento[];
  addTratamento: (item: Tratamento) => Promise<void>;
  updateTratamento: (id: string, item: Tratamento) => Promise<void>;
  deleteTratamento: (id: string) => Promise<void>;
  loadTratamentos: () => Promise<void>;
  // Estado e operações de adesões
  adesoes: Adesao[];
  addAdesao: (item: Adesao) => Promise<void>;
  updateAdesao: (id: string, item: Adesao) => Promise<void>;
  deleteAdesao: (id: string) => Promise<void>;
  loadAdesoes: () => Promise<void>;
};

// Criação do contexto com valor inicial indefinido (garante uso dentro do Provider)
export const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider Principal da Aplicação ─────────────────────────────────────────
// Encapsula toda a lógica de estado global e expõe via Context API
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotification();

  // Estados globais da aplicação
  const [userId, setUserIdState] = useState<string | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [adesoes, setAdesoes] = useState<Adesao[]>([]);

  // Recupera o ID do usuário salvo localmente ao inicializar o app
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

  /** Persiste o ID do usuário no estado e no armazenamento local */
  const setUserId = async (id: string) => {
    setUserIdState(id);
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, id);
  };

  // Carrega todos os dados da API apenas se o usuário estiver autenticado (token presente)
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

  // ─── Funções de Carregamento (Leitura da API) ──────────────────────────────

  /** Busca a lista de medicamentos da API e atualiza o estado global */
  const loadMedicamentos = async () => {
    try {
      const response = await api.get("/medicamentos", {
        params: { skip: 0, take: 500 },
      });
      // Suporta diferentes formatos de resposta da API
      const dados = response.data?.medicamentos || response.data?.dados || [];
      setMedicamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error);
    }
  };

  /** Busca a lista de pacientes da API e atualiza o estado global */
  const loadPacientes = async () => {
    try {
      const response = await api.get("/pacientes");
      const dados = response.data?.dados || response.data?.pacientes || [];
      setPacientes(dados);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  };

  /** Busca a lista de tratamentos da API e atualiza o estado global */
  const loadTratamentos = async () => {
    try {
      const response = await api.get("/tratamentos");
      const dados = response.data?.tratamentos || response.data?.dados || [];
      setTratamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar tratamentos:", error);
    }
  };

  /** Busca a lista de adesões da API e atualiza o estado global */
  const loadAdesoes = async () => {
    try {
      const response = await api.get("/adesoes");
      const dados = response.data?.adesoes || response.data?.dados || [];
      setAdesoes(dados);
    } catch (error) {
      console.error("Erro ao carregar adesões:", error);
    }
  };

  // ─── CRUD de Medicamentos ──────────────────────────────────────────────────

  /** Cadastra um novo medicamento na API e adiciona ao estado local */
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

  /** Atualiza os dados de um medicamento existente na API e no estado local */
  const updateMedicamento = async (id: string, item: Medicamento) => {
    try {
      await api.put(`/medicamentos/${id}`, item);
      // Substitui o item correspondente pelo novo, comparando ID direto ou base do ID
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

  /** Remove um medicamento da API e do estado local */
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

  // ─── CRUD de Pacientes ─────────────────────────────────────────────────────

  /** Cadastra um novo paciente vinculando ao usuário logado */
  const addPaciente = async (item: Paciente) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      // Injeta o ID do usuário criador no payload
      const payload = { ...item, id_usuario: userId };
      const response = await api.post("/pacientes", payload);
      setPacientes((prev) => [...prev, response.data]);
      showNotification("success", "Paciente cadastrado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao cadastrar paciente");
      throw error;
    }
  };

  /** Atualiza os dados de um paciente existente na API e no estado local */
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

  /** Remove um paciente da API e do estado local */
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

  // ─── CRUD de Tratamentos ───────────────────────────────────────────────────

  /** Cadastra um novo tratamento vinculando ao usuário criador */
  const addTratamento = async (item: Tratamento) => {
    try {
      if (!userId) throw new Error("Usuário não identificado");
      // Inclui o ID do farmacêutico/aluno que está criando o tratamento
      const payload = { ...item, id_usuario_criador: userId };
      const response = await api.post("/tratamentos", payload);
      setTratamentos((prev) => [...prev, response.data]);
      showNotification("success", "Tratamento cadastrado com sucesso");
    } catch (error) {
      showNotification("error", "Erro ao cadastrar tratamento");
      throw error;
    }
  };

  /** Atualiza os dados de um tratamento existente na API e no estado local */
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

  /** Remove um tratamento da API e do estado local */
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

  // ─── CRUD de Adesões ───────────────────────────────────────────────────────

  /** Registra uma nova adesão ao tratamento */
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

  /** Atualiza os dados de uma adesão existente na API e no estado local */
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

  /** Remove uma adesão da API e do estado local */
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

  // Objeto de valor exposto pelo contexto para todos os componentes filhos
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

// ─── Hook Personalizado ────────────────────────────────────────────────────────
// Facilita o acesso ao contexto e garante que seja usado dentro do AppProvider
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export default AppProvider;
