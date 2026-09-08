/**
 * Centraliza a lógica de permissões por perfil de usuário.
 *
 *  - PROFESSOR   → acesso total (criar/editar/excluir tudo, ver todos os registros)
 *  - COORDENADOR → somente leitura (vê tudo, sem botões de criar/editar/excluir)
 *  - ALUNO       → vê apenas o que ele criou
 *  - PACIENTE    → vê apenas seus dados + pode registrar a própria adesão
 */

/** Perfis que têm acesso de escrita (criar, editar, excluir) */
export const canWrite = (role: string) => {
  const r = role.toUpperCase();
  return r === "PROFESSOR" || r === "ALUNO" || r === "FARMACEUTICO";
};

/** Perfis que vêem todos os registros sem filtro */
export const canSeeAll = (role: string) => {
  const r = role.toUpperCase();
  return r === "PROFESSOR" || r === "COORDENADOR";
};

/** Perfil é PACIENTE */
export const isPaciente = (role: string) => role.toUpperCase() === "PACIENTE";

/** Perfil é COORDENADOR (somente leitura) */
export const isCoordenador = (role: string) =>
  role.toUpperCase() === "COORDENADOR";

/** Perfil é ALUNO */
export const isAluno = (role: string) => role.toUpperCase() === "ALUNO";

/** Perfil é PROFESSOR */
export const isProfessor = (role: string) => role.toUpperCase() === "PROFESSOR";
