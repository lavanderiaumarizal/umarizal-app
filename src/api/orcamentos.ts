/**
 * api/orcamentos.ts — Endpoints de orçamentos consumidos pelo app (B13/B14)
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

/** Item de orçamento (sem valores financeiros — motorista não vê preços) */
export interface ItemResumo {
  id: string;
  servicoNome: string | null;
  categoriaNome: string | null;
  tipoCobranca: string;
  largura: number | null;
  comprimento: number | null;
  quantidade: number;
  opcaoNome: string | null;
  escalaNome: string | null;
}

/** Orçamento resumido (sem valores financeiros) */
export interface OrcamentoResumo {
  id: string;
  codigo: string;
  status: string;
  faseAtual: string;
  dataColetaAgendada: string | null;
  dataEntregaAgendada: string | null;
  dataEntregaPrevista: string | null;
  dataColetaRealizada: string | null;
  dataEntregaRealizada: string | null;
  observacoes: string | null;
  cliente: {
    id: string;
    nome: string;
    telefone: string | null;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsLink: string | null;
  };
  itens: ItemResumo[];
}

/** GET /api/orcamentos/minhas-coletas (B13) */
export async function minhasColetas(): Promise<
  ApiSuccessResponse<{ transportador: { id: number; nome: string; placaVeiculo: string | null } | null; total: number; coletas: OrcamentoResumo[] }>
> {
  const { data } = await api.get('/orcamentos/minhas-coletas');
  return data;
}

/** GET /api/orcamentos/minhas-entregas (B14) */
export async function minhasEntregas(): Promise<
  ApiSuccessResponse<{ transportador: { id: number; nome: string; placaVeiculo: string | null } | null; total: number; entregas: OrcamentoResumo[] }>
> {
  const { data } = await api.get('/orcamentos/minhas-entregas');
  return data;
}

/** Foto do estado inicial (formato do backend — fotos.controller) */
export interface Foto {
  id: number;
  itemId: string | null;
  original: string;
  thumb: string;
  formato: 'novo' | 'antigo';
}

/** GET /api/orcamentos/:id — detalhes do orçamento (F10) */
export async function getOrcamento(id: string): Promise<OrcamentoDetalhe> {
  const { data } = await api.get<ApiSuccessResponse<OrcamentoDetalhe>>(`/orcamentos/${id}`);
  return data.data;
}

/** GET /api/orcamentos/:id/fotos — fotos do estado inicial (F10) */
export async function getFotos(id: string): Promise<Foto[]> {
  const { data } = await api.get<ApiSuccessResponse<Foto[]>>(`/orcamentos/${id}/fotos`);
  return data.data;
}

/** Detalhe do orçamento (sem exibir valores financeiros — doc 6) */
export interface OrcamentoDetalhe extends OrcamentoResumo {
  cliente: OrcamentoResumo['cliente'] & { email?: string | null };
  itens: ItemResumo[];
}
