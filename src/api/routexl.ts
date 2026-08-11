/**
 * api/routexl.ts — Endpoints de rota do dia (B22/B23)
 */

import api from './client';
import type { ApiSuccessResponse } from '../types';

/** Parada da rota do dia (B23 — concluido incluso) */
export interface Waypoint {
  ordem: number;
  tipo: 'DEPOT' | 'COLETA' | 'ENTREGA';
  latitude: number | null;
  longitude: number | null;
  enderecoCompleto: string | null;
  horarioChegada: string | null;
  distanciaKm: number | null;
  servicoMin: number | null;
  concluido: boolean;
}

/** Parada (stop) — sem DEPOT, com orcamentoId */
export interface Stop {
  ordem: number;
  orcamentoId: string | null;
  cliente: unknown;
  endereco: { logradouro: string } | null;
  tipo: 'COLETA' | 'ENTREGA';
  status: unknown;
  horarioChegada: string | null;
  distanciaAcumuladaKm: number | null;
  tempoServicoMinutos: number | null;
  concluido: boolean;
}

export interface RotaDoDia {
  id: string;
  data: string;
  totalDistanceKm: number | null;
  totalDurationMinutes: number | null;
  allWaypoints: Waypoint[];
  stops: Stop[];
}

/** GET /api/routexl/rota-do-dia?data=YYYY-MM-DD (B22/B23) */
export async function getRotaDoDia(data: string): Promise<RotaDoDia | null> {
  const { data: res } = await api.get<ApiSuccessResponse<RotaDoDia | null>>('/routexl/rota-do-dia', {
    params: { data },
  });
  return res.data;
}

/** Evento do calendário (coletas/entregas do dia) */
export interface EventoCalendario {
  id: string;
  tipo: 'COLETA' | 'ENTREGA';
  orcamentoId: string | null;
  codigo: string;
  cliente: {
    nome: string;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  };
  data: string | null;
  status: string;
  tempoPermanencia?: number;
}

/** GET /api/orcamentos/logistica/calendario/eventos */
export async function getEventosDia(data: string): Promise<EventoCalendario[]> {
  const { data: res } = await api.get<ApiSuccessResponse<EventoCalendario[]>>(
    '/orcamentos/logistica/calendario/eventos',
    { params: { dataInicio: data, dataFim: data } },
  );
  return res.data;
}

/** POST /api/routexl/optimize — otimiza a rota do dia */
export async function optimizeRota(stops: unknown[], options?: unknown): Promise<any> {
  const { data } = await api.post('/routexl/optimize', { stops, options });
  return data.data;
}

/** POST /api/routexl/save-route — salva a rota otimizada */
export async function saveRota(date: string, optimizedRoute: unknown, stops: unknown[]): Promise<{ routeId: string }> {
  const { data } = await api.post('/routexl/save-route', { date, optimizedRoute, stops });
  return data.data;
}

/** Monta o endereço completo a partir do evento */
export function enderecoDoEvento(e: EventoCalendario): string {
  const c = e.cliente;
  const partes = [
    c.endereco,
    c.numero ? `, ${c.numero}` : '',
    c.complemento ? ` ${c.complemento}` : '',
    c.bairro ? ` - ${c.bairro}` : '',
    c.cidade ? ` - ${c.cidade}${c.uf ? `-${c.uf}` : ''}` : '',
  ];
  return partes.join('').trim();
}

/**
 * Remove o prefixo de código ("ORC-XXX - ") do endereço, se presente.
 * O backend grava o endereço do waypoint como "CODIGO - ENDERECO".
 */
export function limparEndereco(endereco: string): string {
  const partes = endereco.split(' - ');
  if (partes.length > 1 && !partes[0].includes(' ') && !partes[0].includes(',')) {
    return partes.slice(1).join(' - ');
  }
  return endereco;
}

/** Abre o Google Maps para navegação até a parada (F19) */
export function abrirMapsParada(endereco: string, lat?: number | null, lng?: number | null): void {
  // Sem Linking aqui — o caller (tela) decide (evita import de Linking no módulo de API)
  void endereco;
  void lat;
  void lng;
}
