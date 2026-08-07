/**
 * api/relatorio.ts — Relatório do Dia (F30)
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

export interface RelatorioDia {
  data: string;
  totalColetas: number;
  totalEntregas: number;
  valorColetas?: number;
  valorEntregas?: number;
  porTipoServico: Array<{ categoria: string; quantidade: number; valor?: number }>;
  tempoMedioFase: Array<{ fase: string; label: string; minutosMedios: number }>;
  admin: boolean;
}

/** GET /api/relatorio/dia?data=YYYY-MM-DD */
export async function getRelatorioDia(data: string): Promise<RelatorioDia> {
  const { data: res } = await api.get<ApiSuccessResponse<RelatorioDia>>('/relatorio/dia', {
    params: { data },
  });
  return res.data;
}
