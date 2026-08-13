/**
 * api/weather.ts — Previsão do tempo (issue 8)
 *
 * GET /api/weather/previsao?dias=16 — dados completos (máx, mín, chance de chuva,
 * umidade, vento) via Open-Meteo no backend.
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

export interface PrevisaoDia {
  data: string;
  temperaturaMax: number | null;
  temperaturaMin: number | null;
  temperaturaMedia: number | null;
  chuvaTotal: number;
  probabilidadeChuva: number | null;
  umidadeMax: number | null;
  ventoMax: number | null;
  fatorSecagem: 'bom' | 'regular' | 'ruim';
  icone: string;
}

/** GET /api/weather/previsao?dias=N */
export async function getPrevisao(dias = 16): Promise<PrevisaoDia[]> {
  const { data: res } = await api.get<ApiSuccessResponse<PrevisaoDia[]>>('/weather/previsao', {
    params: { dias },
  });
  return res.data;
}
