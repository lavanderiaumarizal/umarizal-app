/**
 * api/etapas.ts — Endpoints de etapas de produção (B5–B8)
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

/** Etapa retornada pelo backend (B8) */
export interface EtapaDetalhe {
  etapa: number;
  nome: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  responsavel?: string;
  concluidoEm?: string | null;
  observacoes?: string | null;
}

/** Resposta do GET /api/etapas/:orcamentoId — objeto etapa_1..etapa_12 */
export type EtapasResponse = Record<`etapa_${number}`, EtapaDetalhe>;

/** GET /api/etapas/:orcamentoId (B8) — status das 12 etapas */
export async function getEtapas(orcamentoId: string): Promise<EtapasResponse> {
  const { data } = await api.get<ApiSuccessResponse<EtapasResponse>>(`/etapas/${orcamentoId}`);
  return data.data;
}

/** POST /api/etapas/:orcamentoId/iniciar (B5) */
export async function iniciarEtapa(
  orcamentoId: string,
  etapa: number,
  responsavel: string,
): Promise<EtapaDetalhe> {
  const { data } = await api.post<ApiSuccessResponse<EtapaDetalhe>>(`/etapas/${orcamentoId}/iniciar`, {
    etapa,
    responsavel,
  });
  return data.data;
}

/** POST /api/etapas/:orcamentoId/concluir (B6) */
export async function concluirEtapa(
  orcamentoId: string,
  etapa: number,
  responsavel: string,
  observacoes?: string,
): Promise<EtapaDetalhe & { faseSincronizada?: boolean; faseAtual?: string }> {
  const { data } = await api.post<ApiSuccessResponse<any>>(`/etapas/${orcamentoId}/concluir`, {
    etapa,
    responsavel,
    observacoes,
  });
  return data.data;
}

/** POST /api/etapas/:orcamentoId/retornar (B7) */
export async function retornarEtapa(
  orcamentoId: string,
  etapa: number,
  motivo: string,
): Promise<EtapaDetalhe> {
  const { data } = await api.post<ApiSuccessResponse<EtapaDetalhe>>(`/etapas/${orcamentoId}/retornar`, {
    etapa,
    motivo,
  });
  return data.data;
}
