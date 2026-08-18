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

/** POST /api/orcamentos/:id/coleta-realizada (B9) — assinatura opcional (login) */
export async function coletaRealizada(
  id: string,
  dados: { fotos?: string[]; assinatura?: string | null; observacoes?: string },
): Promise<ApiSuccessResponse<any>> {
  const { data } = await api.post(`/orcamentos/${id}/coleta-realizada`, dados);
  return data;
}

/** POST /api/orcamentos/:id/entrega-realizada (B10) — assinatura opcional (login) */
export async function entregaRealizada(
  id: string,
  dados: { assinatura?: string | null; observacoes?: string; fotos?: string[] },
): Promise<ApiSuccessResponse<any>> {
  const { data } = await api.post(`/orcamentos/${id}/entrega-realizada`, dados);
  return data;
}

/** Item do almoxarifado (F26) */
export interface TapeteAlmoxarifado {
  id: string;
  codigo: string;
  status: string;
  faseAtual: string;
  dataColetaAgendada: string | null;
  dataEntregaAgendada: string | null;
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
  };
  itens: Array<{
    id: string;
    servicoNome: string | null;
    categoriaNome: string | null;
    largura: number | null;
    comprimento: number | null;
    quantidade: number;
    opcaoNome: string | null;
    escalaNome: string | null;
  }>;
  carregamentoVeiculo: {
    carregadoEm: string;
    veiculo: string;
    usuario: { nome: string };
  } | null;
}

/** GET /api/orcamentos/almoxarifado (F26) */
export async function getAlmoxarifado(params: {
  q?: string;
  status?: string;
  periodo?: string;
  tipo?: string;
  data?: string;
}): Promise<TapeteAlmoxarifado[]> {
  const { data } = await api.get<ApiSuccessResponse<TapeteAlmoxarifado[]>>('/orcamentos/almoxarifado', {
    params,
  });
  return data.data;
}

/** POST /api/orcamentos/:id/carregar (B11) */
export async function carregarOrcamento(id: string, veiculo = 'principal'): Promise<any> {
  const { data } = await api.post(`/orcamentos/${id}/carregar`, { veiculo });
  return data;
}

/** DELETE /api/orcamentos/:id/carregar (B12) */
export async function descarregarOrcamento(id: string): Promise<any> {
  const { data } = await api.delete(`/orcamentos/${id}/carregar`);
  return data;
}

/** Orçamento aguardando documentação (B21) */
export interface OrcamentoDocumentacao {
  id: string;
  codigo: string;
  status: string;
  faseAtual: string;
  dataColetaAgendada: string | null;
  dataColetaRealizada: string | null;
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
  };
  itens: Array<{
    id: string;
    servicoNome: string | null;
    categoriaNome: string | null;
    largura: number | null;
    comprimento: number | null;
    quantidade: number;
    opcaoNome: string | null;
    escalaNome: string | null;
  }>;
}

/** Estatísticas do dashboard (admin — issue 4) */
export interface DashboardStats {
  totalOrcamentos: number;
  aprovados: number;
  recusados: number;
  totalClientes: number;
  faturamentoTotal: number;
  faturamento: { _sum: { valorTotal: number } } | null;
  totalAprovados: number;
  taxaConversao: number;
  ticketMedio: number;
  ocupacaoEstufa: number;
  cicloMedio: number;
}

/** GET /api/orcamentos/stats */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiSuccessResponse<DashboardStats>>('/orcamentos/stats');
  return data.data;
}

/** GET /api/orcamentos/documentacao-pendente (B21) */
export async function documentacaoPendente(): Promise<OrcamentoDocumentacao[]> {
  const { data } = await api.get<ApiSuccessResponse<OrcamentoDocumentacao[]>>('/orcamentos/documentacao-pendente');
  return data.data;
}

/** Histórico de fases (timeline do painel admin — issue 8) */
export interface FaseHistorico {
  id: number;
  fase: string;
  label: string;
  status: string;
  usuarioId: number | null;
  fotos: unknown[];
  observacoes: string | null;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  duracaoSeg: number | null;
}

/** GET /api/orcamentos/:id/fase/historico — mesma timeline do painel admin */
export async function getHistoricoFases(id: string): Promise<FaseHistorico[]> {
  const { data } = await api.get<ApiSuccessResponse<FaseHistorico[]>>(`/orcamentos/${id}/fase/historico`);
  return data.data;
}

/** POST /api/orcamentos/:id/fotos — upload com vínculo por item (F33) */
export async function uploadFotos(
  id: string,
  fotos: string[],
  itemId?: string,
): Promise<any> {
  const { data } = await api.post(`/orcamentos/${id}/fotos`, { fotos, itemId });
  return data;
}

/** DELETE /api/orcamentos/:id/fotos/:indice (F34) */
export async function deleteFoto(id: string, indice: number): Promise<any> {
  const { data } = await api.delete(`/orcamentos/${id}/fotos/${indice}`);
  return data;
}
