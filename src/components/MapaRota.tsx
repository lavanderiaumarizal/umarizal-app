/**
 * components/MapaRota.tsx — Mapa da rota do dia (F14.1)
 *
 * MapLibre GL + OpenFreeMap (tiles OpenStreetMap) — 100% gratuito, SEM chave
 * e SEM conta Google. (Opção B — escolhida por não exigir configuração.)
 *
 * - Markers custom: COLETA 🟢 · ENTREGA 🔵 (com número da ordem)
 * - Linha conectando as paradas na ordem da rota (GeoJSON LineString)
 * - Callout em overlay ao tocar num marker + botão "Navegar"
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '../theme';
import type { Waypoint } from '../api/routexl';

/** Style gratuito do OpenFreeMap (tiles OpenStreetMap, sem chave) */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const COR_COLETA = '#22c55e'; // verde
const COR_ENTREGA = '#3b82f6'; // azul

interface Props {
  waypoints: Waypoint[];
}

export default function MapaRota({ waypoints }: Props) {
  const [selecionado, setSelecionado] = useState<Waypoint | null>(null);

  const paradas = waypoints.filter(
    (w): w is Waypoint & { latitude: number; longitude: number } =>
      w.tipo !== 'DEPOT' && w.latitude != null && w.longitude != null,
  );

  const rotaCoords = paradas.map((p) => [p.longitude, p.latitude] as [number, number]);

  const center = paradas.length
    ? {
        longitude: paradas.reduce((s, p) => s + p.longitude, 0) / paradas.length,
        latitude: paradas.reduce((s, p) => s + p.latitude, 0) / paradas.length,
      }
    : { longitude: -46.6333, latitude: -23.5505 };

  function navegar(wp: Waypoint) {
    const url = `https://maps.google.com/?daddr=${wp.latitude},${wp.longitude}`;
    void Linking.openURL(url).catch(() => undefined);
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
        />

        {/* Linha da rota */}
        {rotaCoords.length > 1 && (
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
        )}

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
              {selecionado.ordem}. {selecionado.tipo === 'COLETA' ? '🟢 Coleta' : '🔵 Entrega'}
              {selecionado.concluido ? ' ✅' : ''}
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
    fontSize: 12,
    fontWeight: 'bold',
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
  calloutTitulo: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  calloutEndereco: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  calloutHorario: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  calloutBotao: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  calloutBotaoText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
