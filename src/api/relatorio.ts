/**
 * api/relatorio.ts — Relatório do Dia (F30)
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

/** Item de orçamento no relatório (ex.: "3,00x4,00m Carro") */
export interface RelatorioItem {
  descricao: string;
  quantidade: number;
  /** Metragem do item em m² (largura×comprimento×qtd) — null sem medidas */
  areaM2?: number | null;
}

/** Orçamento detalhado do dia (coleta ou entrega) */
export interface RelatorioOrcamento {
  id: string;
  codigo: string;
  cliente: string | null;
  telefone: string | null;
  endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  usaEnderecoServico: boolean;
  tipo: 'COLETA' | 'ENTREGA';
  realizada: boolean;
  status: string;
  data: string | null;
  itens: RelatorioItem[];
  valor?: number;
  /** Metragem total do orçamento em m² */
  areaM2?: number;
}

/** Resumo da rota do dia (o dado que o motorista reconhece) */
export interface RelatorioRota {
  existe: boolean;
  totalParadas: number;
  paradasConcluidas: number;
  coletasPendentes: number;
  entregasPendentes: number;
  horarioSaida: string | null;
  previsaoRetorno: string | null;
  distanciaKm: number | null;
  duracaoMin: number | null;
}

export interface RelatorioDia {
  data: string;
  totalColetas: number;
  totalEntregas: number;
  coletasAgendadas?: number;
  entregasAgendadas?: number;
  coletasDetalhe?: RelatorioOrcamento[];
  entregasDetalhe?: RelatorioOrcamento[];
  valorColetas?: number;
  valorEntregas?: number;
  /** Metragem do dia em m² (coletas / entregas — listas mescladas do dia) */
  areaColetasM2?: number;
  areaEntregasM2?: number;
  rota?: RelatorioRota;
  porTipoServico: Array<{ categoria: string; quantidade: number; valor?: number; areaM2?: number }>;
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
