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
