/**
 * components/MapaRota.tsx — Mapa da rota do dia (F14.1)
 *
 * MapLibre GL + OpenFreeMap (tiles OpenStreetMap) — 100% gratuito, SEM chave
 * e SEM conta Google. (Opção B — escolhida por não exigir configuração.)
 *
 * - Markers custom: COLETA 🟢 · ENTREGA 🔵 (com número da ordem)
 * - Traçado REAL pelas ruas (geometry [[lat,lng]] do ORS) quando disponível;
 *   fallback: linha reta entre as paradas
 * - Callout em overlay ao tocar num marker + botão "Navegar"
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '../theme';
import type { Waypoint } from '../api/rotas';

/** Style gratuito do OpenFreeMap (tiles OpenStreetMap, sem chave) */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const COR_COLETA = '#22c55e'; // verde
const COR_ENTREGA = '#3b82f6'; // azul
const COR_DEPOT = '#f59e0b'; // âmbar — origem/destino (lavanderia)

interface Props {
  waypoints: Waypoint[];
  /** Traçado real pelas ruas (pares [lat, lng]) — do ORS via backend */
  geometry?: number[][] | null;
  /** Mostra a posição atual do motorista (quando rastreamento ativo) */
  mostrarMinhaPosicao?: boolean;
  /** Callback de navegação in-app (substitui o Google Maps) */
  onNavegar?: (wp: Waypoint) => void;
}

export default function MapaRota({ waypoints, geometry, mostrarMinhaPosicao = false, onNavegar }: Props) {
  const [selecionado, setSelecionado] = useState<Waypoint | null>(null);

  const paradas = waypoints.filter(
    (w): w is Waypoint & { latitude: number; longitude: number } =>
      w.tipo !== 'DEPOT' && w.latitude != null && w.longitude != null,
  );

  // Origem/destino (DEPOT = lavanderia) — agora visíveis no mapa
  const depots = waypoints.filter(
    (w): w is Waypoint & { latitude: number; longitude: number } =>
      w.tipo === 'DEPOT' && w.latitude != null && w.longitude != null,
  );

  // Linha de referência: origem → paradas → destino (na ordem da rota)
  const rotaCoords = waypoints
    .filter(
      (w): w is Waypoint & { latitude: number; longitude: number } =>
        w.latitude != null && w.longitude != null,
    )
    .map((p) => [p.longitude, p.latitude] as [number, number]);

  // Traçado real: GeoJSON usa [lng, lat]
  const geometriaReal =
    geometry && geometry.length > 1
      ? geometry
          .filter((c) => Array.isArray(c) && c.length === 2)
          .map((c) => [c[1], c[0]] as [number, number])
      : null;

  const todos = [...paradas, ...depots];
  const center = todos.length
    ? {
        longitude: todos.reduce((s, p) => s + p.longitude, 0) / todos.length,
        latitude: todos.reduce((s, p) => s + p.latitude, 0) / todos.length,
      }
    : { longitude: -46.6333, latitude: -23.5505 };

  // Enquadra origem, destino e todas as paradas no mapa
  const bounds =
    todos.length >= 2
      ? {
          ne: [
            Math.max(...todos.map((p) => p.longitude)),
            Math.max(...todos.map((p) => p.latitude)),
          ] as [number, number],
          sw: [
            Math.min(...todos.map((p) => p.longitude)),
            Math.min(...todos.map((p) => p.latitude)),
          ] as [number, number],
          paddingLeft: 48,
          paddingRight: 48,
          paddingTop: 48,
          paddingBottom: 48,
        }
      : null;

  function navegar(wp: Waypoint) {
    if (onNavegar) {
      onNavegar(wp);
    }
  }

  return (
    <View style={styles.wrap}>
      <MapLibreGL.Map
        style={styles.mapa}
        mapStyle={STYLE_URL}
        onPress={() => setSelecionado(null)}
      >
        <MapLibreGL.Camera
          center={[center.longitude, center.latitude]}
          zoom={11}
          {...(bounds ?? {})}
        />

        {/* Posição do motorista (GPS — só quando rastreamento ativo) */}
        {mostrarMinhaPosicao && <MapLibreGL.UserLocation animated />}

        {/* Traçado real pelas ruas (ORS); fallback: linha reta entre paradas */}
        {geometriaReal ? (
          <MapLibreGL.GeoJSONSource
            id="rota-real"
            data={{ type: 'LineString', coordinates: geometriaReal }}
          >
            <MapLibreGL.Layer
              id="rota-real-camada"
              type="line"
              style={{ lineColor: colors.primary, lineWidth: 4, lineOpacity: 0.95 }}
            />
          </MapLibreGL.GeoJSONSource>
        ) : rotaCoords.length > 1 ? (
          <MapLibreGL.GeoJSONSource
            id="rota-linha"
            data={{ type: 'LineString', coordinates: rotaCoords }}
          >
            <MapLibreGL.Layer
              id="rota-linha-camada"
              type="line"
              style={{ lineColor: colors.primary, lineWidth: 3, lineOpacity: 0.9 }}
            />
          </MapLibreGL.GeoJSONSource>
        ) : null}

        {/* Origem/destino (lavanderia) — primeiro e último pontos da rota */}
        {depots.map((wp, i) => (
          <MapLibreGL.Marker
            key={`depot-${wp.ordem}-${i}`}
            id={`pin-depot-${wp.ordem}-${i}`}
            lngLat={[wp.longitude, wp.latitude]}
            onPress={() => setSelecionado(wp)}
          >
            <View
              style={[
                styles.pinDepot,
                {
                  borderColor:
                    selecionado?.tipo === 'DEPOT' && selecionado?.ordem === wp.ordem
                      ? '#fff'
                      : 'transparent',
                },
              ]}
            >
              <Text style={styles.pinNumero}>{i === 0 ? '🏠' : '🏁'}</Text>
            </View>
          </MapLibreGL.Marker>
        ))}

        {/* Markers das paradas */}
        {paradas.map((wp) => (
          <MapLibreGL.Marker
            key={wp.ordem}
            id={`pin-${wp.ordem}`}
            lngLat={[wp.longitude, wp.latitude]}
            onPress={() => setSelecionado(wp)}
          >
            <View
              style={[
                styles.pin,
                {
                  backgroundColor: wp.tipo === 'COLETA' ? COR_COLETA : COR_ENTREGA,
                  borderColor: selecionado?.ordem === wp.ordem ? '#fff' : 'transparent',
                },
              ]}
            >
              <Text style={styles.pinNumero}>{wp.ordem}</Text>
            </View>
          </MapLibreGL.Marker>
        ))}
      </MapLibreGL.Map>

      {/* Callout em overlay (mais estável que o Callout nativo) */}
      {selecionado && (
        <View style={styles.calloutOverlay}>
          <View style={styles.callout}>
            <Text style={styles.calloutTitulo}>
              {selecionado.tipo === 'DEPOT'
                ? `🏠 Lavanderia · ${selecionado.horarioChegada ? `saída/retorno ${selecionado.horarioChegada}` : 'origem/destino'}`
                : `${selecionado.ordem}. ${selecionado.tipo === 'COLETA' ? '🟢 Coleta' : '🔵 Entrega'}${selecionado.concluido ? ' ✅' : ''}`}
            </Text>
            <Text style={styles.calloutEndereco} numberOfLines={2}>
              {selecionado.enderecoCompleto ?? 'Endereço não informado'}
            </Text>
            <Text style={styles.calloutHorario}>
              {selecionado.horarioChegada ? `Chegada prevista: ${selecionado.horarioChegada}` : ''}
            </Text>
            <TouchableOpacity style={styles.calloutBotao} onPress={() => navegar(selecionado)}>
              <Text style={styles.calloutBotaoText}>📍 Navegar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  mapa: { flex: 1 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinNumero: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pinDepot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COR_DEPOT,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  callout: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  calloutTitulo: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  calloutEndereco: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  calloutHorario: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  calloutBotao: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  calloutBotaoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
