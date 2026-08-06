/**
 * types/index.ts — Tipos compartilhados do app Umarizal
 */

/** Perfis do app (multi-perfil — B3) */
export type Perfil = 'admin' | 'motorista' | 'expedicao' | 'lavagem' | 'secagem';

/** Usuário retornado pelo login (B4) */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivel: string; // legado
  perfis: Perfil[];
  transportadorId?: number;
  veiculo?: string;
}

/** Resposta do POST /api/auth/login */
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/** Erro padronizado da API: { success: false, error: { code, message } } */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Sucesso padronizado: { success: true, data, message? } */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Etapa de produção (B1) */
export interface Etapa {
  etapa: number;
  nome: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  responsavel?: string;
  concluidoEm?: string | null;
  observacoes?: string | null;
}
