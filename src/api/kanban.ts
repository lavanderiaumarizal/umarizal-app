/**
 * api/kanban.ts — Kanban por perfil (B18)
 */

import api from './client';
import type { ApiSuccessResponse, Perfil } from '../types';
import type { OrcamentoResumo } from './orcamentos';

/** Item do kanban: orçamento + etapa atual do perfil */
export interface KanbanItem {
  orcamento: Omit<OrcamentoResumo, 'etapasProducao'> & {
    valorTotal?: number;
    statusPagamento?: string;
  };
  etapaAtual: number | null;
  etapaStatus: 'pendente' | 'em_andamento' | 'concluida';
}

export interface KanbanResponse {
  perfil: Perfil;
  colunas: {
    pendente: KanbanItem[];
    em_andamento: KanbanItem[];
    concluida: KanbanItem[];
  };
  total: number;
}

/** GET /api/kanban/:perfil (B18) */
export async function kanbanPorPerfil(perfil: Perfil): Promise<ApiSuccessResponse<KanbanResponse>> {
  const { data } = await api.get(`/kanban/${perfil}`);
  return data;
}

/** Rótulos das 12 etapas */
export const ETAPA_NOME: Record<number, string> = {
  1: 'Coleta',
  2: 'Documentação',
  3: 'Aspiração',
  4: 'Lavagem',
  5: 'Higienização',
  6: 'Centrifugação',
  7: 'Estendagem',
  8: 'Estufa',
  9: 'Escovação',
  10: 'Inspeção Final',
  11: 'Embalagem',
  12: 'Devolução',
};
