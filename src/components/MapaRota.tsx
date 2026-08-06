/**
 * components/MapaRota.tsx — Mapa da rota do dia (F14.1)
 *
 * - Pins: COLETA 🟢 (verde) · ENTREGA 🔵 (azul)
 * - Linha conectando as paradas na ordem da rota
 * - Callout com tipo/horário + endereço + botão "Navegar"
 */

import MapView, { Marker, Polyline, Callout, type Region } from 'react-native-maps';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../theme';
import type { Waypoint } from '../api/routexl';

interface Props {
  waypoints: Waypoint[];
}

const COR_COLETA = '#22c55e'; // verde
const COR_ENTREGA = '#3b82f6'; // azul

export default function MapaRota({ waypoints }: Props) {
  const paradas = waypoints.filter(
    (w): w is Waypoint & { latitude: number; longitude: number } =>
      w.tipo !== 'DEPOT' && w.latitude != null && w.longitude != null,
  );

  // Região inicial: centro das paradas (fallback: São Paulo)
  const region: Region = paradas.length
    ? {
        latitude: paradas.reduce((s, p) => s + p.latitude, 0) / paradas.length,
        longitude: paradas.reduce((s, p) => s + p.longitude, 0) / paradas.length,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : {
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };

  const rotaCoords = paradas.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  function navegar(wp: Waypoint) {
    const url = `https://maps.google.com/?daddr=${wp.latitude},${wp.longitude}`;
    void Linking.openURL(url).catch(() => undefined);
  }

  return (
    <MapView style={styles.mapa} initialRegion={region}>
      {/* Linha da rota */}
      {rotaCoords.length > 1 && (
        <Polyline
          coordinates={rotaCoords}
          strokeColor={colors.primary}
          strokeWidth={3}
          lineDashPattern={[1, 0]}
        />
      )}

      {/* Pins das paradas */}
      {paradas.map((wp) => (
        <Marker
          key={wp.ordem}
          coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
          pinColor={wp.tipo === 'COLETA' ? COR_COLETA : COR_ENTREGA}
          title={`${wp.ordem}. ${wp.tipo === 'COLETA' ? 'Coleta' : 'Entrega'}${wp.horarioChegada ? ` · ${wp.horarioChegada}` : ''}`}
          description={wp.enderecoCompleto ?? ''}
        >
          <Callout tooltip={false} onPress={() => navegar(wp)}>
            <View style={styles.callout}>
              <Text style={styles.calloutTitulo}>
                {wp.ordem}. {wp.tipo === 'COLETA' ? '🟢 Coleta' : '🔵 Entrega'}
                {wp.concluido ? ' ✅' : ''}
              </Text>
              <Text style={styles.calloutEndereco} numberOfLines={2}>
                {wp.enderecoCompleto ?? 'Endereço não informado'}
              </Text>
              <Text style={styles.calloutHorario}>
                {wp.horarioChegada ? `Chegada prevista: ${wp.horarioChegada}` : ''}
              </Text>
              <TouchableOpacity style={styles.calloutBotao} onPress={() => navegar(wp)}>
                <Text style={styles.calloutBotaoText}>📍 Navegar</Text>
              </TouchableOpacity>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { flex: 1 },
  callout: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    width: 200,
  },
  calloutTitulo: { color: colors.text, fontSize: 13, fontWeight: 'bold' },
  calloutEndereco: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  calloutHorario: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  calloutBotao: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calloutBotaoText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
