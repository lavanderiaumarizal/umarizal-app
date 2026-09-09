/**
 * api/rastreamento.ts — Rastreamento em tempo real (GPS do motorista)
 *
 * Pings de posição (funcionam mesmo com o app em segundo plano/fechado,
 * via foreground service do Android), controle de sessão e recálculo das
 * previsões de chegada a partir da posição atual (ORS).
 * Privacidade: a posição só fica visível ao cliente após o horário de saída
 * da rota e com a navegação em curso — regra do backend.
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

export interface SessaoRastreamento {
  id: string;
  routeId: string;
  ativo: boolean;
  iniciadoEm: string;
  horarioSaida: string | null;
  posicao: {
    lat: number;
    lng: number;
    atualizadoEm: string | null;
    velocidadeKmh: number | null;
  } | null;
  totalParadas: number;
  concluidas: number;
  proximaParada: {
    orcamentoId: string | null;
    tipo: 'COLETA' | 'ENTREGA';
    ordem: number;
    endereco: string | null;
    lat: number | null;
    lng: number | null;
    previsao: string | null;
  } | null;
}

export interface PingResult {
  ok: boolean;
  sessaoId: string;
  totalParadas: number;
  concluidas: number;
  proximaParada: SessaoRastreamento['proximaParada'];
}

export interface RecalculoResult {
  rotaId: string;
  atualizadas: Array<{
    orcamentoId: string | null;
    ordem: number;
    tipo: string;
    previsao: string;
  }>;
  retorno: string;
  totalKmRestante: number;
  totalMinRestante: number;
  geometriaAtualizada: boolean;
}

export interface Manobra {
  instrucao: string;
  via: string;
  tipo: string;
  exitNumber?: number | null;
  distanciaM: number;
  duracaoS: number;
  lat: number;
  lng: number;
}

export interface NavegacaoResult {
  coordinates: number[][];
  distanceKm: number;
  durationMin: number;
  manobras: Manobra[];
}

/** Inicia (ou reaproveita) a sessão de rastreamento da rota */
export async function iniciarRastreamento(routeId?: string): Promise<SessaoRastreamento> {
  const { data } = await api.post<ApiSuccessResponse<SessaoRastreamento>>(
    '/logistica/rastreamento/iniciar',
    routeId ? { routeId } : {},
  );
  return data.data;
}

/** Encerra a sessão ativa da rota */
export async function finalizarRastreamento(routeId?: string): Promise<{ encerradas: number }> {
  const { data } = await api.post<ApiSuccessResponse<{ encerradas: number }>>(
    '/logistica/rastreamento/finalizar',
    routeId ? { routeId } : {},
  );
  return data.data;
}

/** Envia a posição atual do GPS (foreground ou background) */
export async function enviarPing(payload: {
  routeId?: string;
  lat: number;
  lng: number;
  precisaoM?: number;
  velocidadeKmh?: number;
  direcaoGrau?: number;
  origem?: 'app' | 'background';
}): Promise<PingResult> {
  const { data } = await api.post<ApiSuccessResponse<PingResult>>(
    '/logistica/rastreamento/ping',
    payload,
  );
  return data.data;
}

/** Recalcula as previsões das paradas pendentes a partir da posição atual */
export async function recalcularDaPosicao(
  routeId: string | undefined,
  lat: number,
  lng: number,
): Promise<RecalculoResult> {
  const { data } = await api.post<ApiSuccessResponse<RecalculoResult>>(
    '/logistica/rastreamento/recalcular',
    { routeId, lat, lng },
  );
  return data.data;
}

/** Turn-by-turn do ORS: geometria + manobras até o destino */
export async function navegarAte(
  lat: number,
  lng: number,
  latDestino: number,
  lngDestino: number,
): Promise<NavegacaoResult> {
  const { data } = await api.post<ApiSuccessResponse<NavegacaoResult>>(
    '/logistica/rastreamento/navegar',
    { lat, lng, latDestino, lngDestino, preference: 'recommended' },
  );
  return data.data;
}
