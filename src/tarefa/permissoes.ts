/**
 * tarefa/permissoes.ts — Bootstrap de permissões (GPS + câmera)
 *
 * O Android só pede permissão EM RUNTIME (nunca na instalação). Antes, os
 * pedidos só aconteciam dentro do fluxo "Iniciar Rota" — se esse fluxo
 * falhava, o motorista nunca via o prompt. Agora pedimos de uma vez na
 * 1ª abertura da Rota do Dia; se já concedidas, as chamadas são silenciosas.
 */

import * as Location from 'expo-location';
import { Camera } from 'expo-camera';

export interface EstadoPermissoes {
  /** Localização em primeiro plano (obrigatória para tudo) */
  localizacao: boolean;
  /** Android 10+ "Permitir o tempo todo" — pings com o app fechado */
  segundoPlano: boolean;
  /** Câmera (fotos da coleta/entrega) */
  camera: boolean;
}

/** Pede o que falta (idempotente — concedidas = sem prompt) */
export async function pedirPermissoesEssenciais(): Promise<EstadoPermissoes> {
  // 1. Localização foreground
  let fg = await Location.getForegroundPermissionsAsync();
  if (!fg.granted && fg.canAskAgain) {
    fg = await Location.requestForegroundPermissionsAsync();
  }
  const localizacao = fg.granted;

  // 2. Localização background ("Permitir o tempo todo")
  let segundoPlano = false;
  if (localizacao) {
    try {
      let bg = await Location.getBackgroundPermissionsAsync();
      if (!bg.granted && bg.canAskAgain) {
        bg = await Location.requestBackgroundPermissionsAsync();
      }
      segundoPlano = bg.granted;
    } catch {
      segundoPlano = false;
    }
  }

  // 3. Câmera
  let cam = await Camera.getCameraPermissionsAsync();
  if (!cam.granted && cam.canAskAgain) {
    cam = await Camera.requestCameraPermissionsAsync();
  }
  const camera = cam.granted;

  return { localizacao, segundoPlano, camera };
}

/** true quando o usuário negou a localização definitivamente (só via Ajustes) */
export async function permissaoLocalizacaoNegadaDefinitivo(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync();
  return !fg.granted && !fg.canAskAgain;
}
