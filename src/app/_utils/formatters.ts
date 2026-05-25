// ─── Utilitários de formatação compartilhados ───────────────────────────────
export default function formatadores() {}
/** Formata data ISO ou Date para DD/MM/AAAA */
export const formatarData = (
  data: string | Date | undefined | null,
): string => {
  if (!data) return "N/A";
  try {
    const date = typeof data === "string" ? new Date(data) : data;
    if (isNaN(date.getTime())) return String(data);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return String(data);
  }
};

/** Converte string DD/MM/AAAA ou ISO para objeto Date. Retorna null se inválida. */
export const parseData = (valor: string): Date | null => {
  if (!valor) return null;
  const dateISO = new Date(valor);
  if (!isNaN(dateISO.getTime())) return dateISO;
  const [diaStr, mesStr, anoStr] = valor.split("/");
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);
  if (!dia || !mes || !ano) return null;
  const date = new Date(ano, mes - 1, dia);
  if (
    date.getFullYear() !== ano ||
    date.getMonth() !== mes - 1 ||
    date.getDate() !== dia
  ) {
    return null;
  }
  return date;
};

/** Converte DD/MM/AAAA para AAAA-MM-DD (formato ISO para API) */
export const converterDataParaISO = (data: string): string | null => {
  if (!data || data.length < 10) return null;
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
};

/** Formata string para CPF: 000.000.000-00 */
export const formatarCpf = (valor: string): string => {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/** Formata string para data: DD/MM/AAAA */
export const formatarDataInput = (valor: string): string => {
  const n = valor.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
};

/** Formata string para telefone: (99) 99999-9999 */
export const formatarTelefone = (valor: string): string => {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return n.replace(/(\d{2})(\d)/, "($1) $2");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d)/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d)/, "($1) $2-$3");
};

/** Formata string para CEP: 00000-000 */
export const formatarCep = (valor: string): string => {
  const n = valor.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d)/, "$1-$2");
};

/** Valida formato de e-mail */
export const validarEmail = (valor: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

/** Validação de CPF (Regras algorítmicas do módulo 11) */
export const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0,
    resto;
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};
