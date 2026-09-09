/**
 * tarefa/rastreamentoFundo.ts — GPS em segundo plano (foreground service Android)
 *
 * Mantém o envio de pings MESMO com o app fechado: `startLocationUpdatesAsync`
 * registra um foreground service com notificação persistente que continua
 * entregando posições via TaskManager. No Android 10+ a permissão de fundo
 * ("Permitir o tempo todo") é pedida separadamente em pedirPermissoesRastreamento.
 *
 * Privacidade: posição vai SEMPRE ao nosso backend (ORS), nunca ao Google Maps.
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { enviarPing } from '../api/rastreamento';

export const RASTREAMENTO_TASK = 'umarizal-rastreamento-rota';

/** RouteId da sessão em curso (lido pela task em background) */
let routeIdAtual: string | null = null;

export function definirRouteIdAtual(routeId: string | null): void {
  routeIdAtual = routeId;
}

// ════════════════════════════════════════════════════════════════
// Task em background — definida no escopo do módulo (antes do app iniciar)
// ════════════════════════════════════════════════════════════════

interface LocationTaskData {
  data?: { locations?: Location.LocationObject[] };
  error?: Error | null;
}

TaskManager.defineTask(RASTREAMENTO_TASK, async (payload) => {
  const { data, error } = payload as unknown as LocationTaskData;
  if (error) return;
  const locations = data?.locations ?? [];
  for (const loc of locations) {
    try {
      await enviarPing({
        routeId: routeIdAtual ?? undefined,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        precisaoM: loc.coords.accuracy ?? undefined,
        velocidadeKmh:
          loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed * 3.6 : undefined,
        direcaoGrau:
          loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : undefined,
        origem: 'background',
      });
    } catch {
      // Silencioso em background — retry no próximo tick do serviço
    }
  }
});

// ════════════════════════════════════════════════════════════════
// Permissões
// ════════════════════════════════════════════════════════════════

export interface PermissoesRastreamento {
  foreground: boolean;
  /** Android 10+ "Permitir o tempo todo" — sem isso os pings param com app fechado */
  background: boolean;
}

export async function pedirPermissoesRastreamento(): Promise<PermissoesRastreamento> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) {
    return { foreground: false, background: false };
  }
  // Android: solicita ACCESS_BACKGROUND_LOCATION ("Permitir o tempo todo")
  let bg = false;
  try {
    const r = await Location.requestBackgroundPermissionsAsync();
    bg = r.granted;
  } catch {
    bg = false;
  }
  return { foreground: true, background: bg };
}

// ════════════════════════════════════════════════════════════════
// Controle do serviço de fundo
// ════════════════════════════════════════════════════════════════

/** Inicia o foreground service de localização (pings continuam com app fechado) */
export async function iniciarRastreamentoFundo(routeId: string): Promise<PermissoesRastreamento> {
  const permissoes = await pedirPermissoesRastreamento();
  if (!permissoes.foreground) {
    throw new Error('PERMISSAO_NEGADA');
  }
  definirRouteIdAtual(routeId);
  await Location.startLocationUpdatesAsync(RASTREAMENTO_TASK, {
    accuracy: Location.Accuracy.High,
    deferredUpdatesInterval: 15000,
    deferredUpdatesDistance: 10,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Umarizal — rota em andamento',
      notificationBody: 'Compartilhando sua posição na rota do dia.',
      notificationColor: '#1d4ed8',
      killServiceOnDestroy: false,
    },
  });
  return permissoes;
}

/** Para o serviço de fundo (a sessão no backend é encerrada pelo caller) */
export async function pararRastreamentoFundo(): Promise<void> {
  try {
    const ativo = await Location.hasStartedLocationUpdatesAsync(RASTREAMENTO_TASK);
    if (ativo) {
      await Location.stopLocationUpdatesAsync(RASTREAMENTO_TASK);
    }
  } finally {
    definirRouteIdAtual(null);
  }
}

/** O serviço de fundo está rodando? */
export async function estaRastreando(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(RASTREAMENTO_TASK);
  } catch {
    return false;
  }
}
