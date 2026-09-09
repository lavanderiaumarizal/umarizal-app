/**
 * components/NavegacaoRota.tsx — Navegação in-app da rota (sem Google Maps)
 *
 * MapLibre + OpenFreeMap (tiles OpenStreetMap, sem chave e sem conta Google).
 * Turn-by-turn do ORS: geometria real pelas ruas + próxima manobra no card.
 * A posição do motorista vem do GPS do aparelho e vai SOMENTE ao nosso backend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '../theme';
import { navegarAte, type Manobra, type NavegacaoResult } from '../api/rastreamento';

/** Style gratuito do OpenFreeMap (tiles OpenStreetMap, sem chave) */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

interface Props {
  destino: {
    lat?: number | null;
    lng?: number | null;
    endereco: string;
    titulo: string;
  };
  onFechar: () => void;
}

function distanciaTexto(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export default function NavegacaoRota({ destino, onFechar }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<NavegacaoResult | null>(null);
  const [manobra, setManobra] = useState<Manobra | null>(null);
  const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const temCoords = destino.lat != null && destino.lng != null;

  const recalcular = useCallback(
    async (lat: number, lng: number) => {
      if (!temCoords) return;
      try {
        const r = await navegarAte(lat, lng, destino.lat as number, destino.lng as number);
        setResultado(r);
        // Primeira manobra "turn" depois de depart (ou a própria, se for útil)
        const proxima =
          r.manobras.find((m) => m.tipo !== 'depart' && m.tipo !== 'arrive' && m.distanciaM > 0) ??
          r.manobras[0] ??
          null;
        setManobra(proxima);
        setErro('');
      } catch {
        setErro('Não foi possível traçar o caminho. Verifique a conexão e tente novamente.');
      } finally {
        setCarregando(false);
      }
    },
    [destino.lat, destino.lng, temCoords],
  );

  // Posição inicial + watcher + atualização periódica da manobra
  useEffect(() => {
    let vivo = true;

    (async () => {
      if (!temCoords) {
        setErro('Coordenadas não disponíveis para este endereço.');
        setCarregando(false);
        return;
      }
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) {
          setErro('Permissão de localização necessária para navegar.');
          setCarregando(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!vivo) return;
        setPosicao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        await recalcular(pos.coords.latitude, pos.coords.longitude);

        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 15 },
          (p) => {
            if (!vivo) return;
            setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude });
          },
        );

        // Recalcula a manobra da posição atual a cada 20s
        intervaloRef.current = setInterval(() => {
          if (posicao) void recalcular(posicao.lat, posicao.lng);
        }, 20000);
      } catch {
        if (vivo) {
          setErro('Não foi possível obter sua posição.');
          setCarregando(false);
        }
      }
    })();

    return () => {
      vivo = false;
      watchRef.current?.remove();
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temCoords]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo}>🧭 {destino.titulo}</Text>
          <Text style={styles.headerEndereco} numberOfLines={1}>{destino.endereco}</Text>
        </View>
        <TouchableOpacity onPress={onFechar}>
          <Text style={styles.fechar}>Fechar ✕</Text>
        </TouchableOpacity>
      </View>

      {temCoords ? (
        <View style={styles.mapaWrap}>
          <MapLibreGL.Map style={StyleSheet.absoluteFill} mapStyle={STYLE_URL}>
            {resultado ? (
              <MapLibreGL.GeoJSONSource
                id="nav-rota"
                data={{
                  type: 'LineString',
                  coordinates: resultado.coordinates.map((c) => [c[1], c[0]] as [number, number]),
                }}
              >
                <MapLibreGL.Layer
                  id="nav-rota-camada"
                  type="line"
                  style={{ lineColor: colors.primary, lineWidth: 6, lineOpacity: 0.95 }}
                />
              </MapLibreGL.GeoJSONSource>
            ) : null}
            {destino.lat != null && destino.lng != null ? (
              <MapLibreGL.Marker id="nav-destino" lngLat={[destino.lng, destino.lat]}>
                <View style={styles.pinDestino}>
                  <Text style={styles.pinDestinoTexto}>🏁</Text>
                </View>
              </MapLibreGL.Marker>
            ) : null}
            {posicao ? (
              <MapLibreGL.Camera
                center={[posicao.lng, posicao.lat]}
                zoom={16}
                duration={800}
              />
            ) : (
              <MapLibreGL.Camera zoom={12} center={[-46.6333, -23.5505]} />
            )}
          </MapLibreGL.Map>
          {/* Marca a posição do motorista por cima (borda azul) */}
          {posicao ? <View style={styles.pontoEu} /> : null}
        </View>
      ) : (
        <View style={styles.semMapa}>
          <Text style={styles.semMapaTexto}>{erro || 'Endereço sem coordenadas no mapa.'}</Text>
        </View>
      )}

      {/* Card de navegação — próxima manobra + chegada */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {carregando ? (
            <View style={styles.cardCentro}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.cardInfo}>Traçando o melhor caminho (ORS)…</Text>
            </View>
          ) : erro ? (
            <View style={styles.cardCentro}>
              <Text style={styles.erro}>{erro}</Text>
            </View>
          ) : resultado ? (
            <>
              {manobra ? (
                <>
                  <Text style={styles.manobra}>{manobra.instrucao}</Text>
                  <Text style={styles.manobraVia} numberOfLines={1}>
                    {manobra.via ? `na ${manobra.via}` : 'continue'} · {distanciaTexto(manobra.distanciaM)}
                  </Text>
                </>
              ) : null}
              <Text style={styles.chegada}>
                🏁 Chegada em ~{Math.max(1, Math.round(resultado.durationMin))} min ·{' '}
                {resultado.distanceKm.toFixed(1)} km
              </Text>
              {posicao ? (
                <TouchableOpacity
                  style={styles.botaoRecalcular}
                  onPress={() => void recalcular(posicao.lat, posicao.lng)}
                >
                  <Text style={styles.botaoRecalcularTexto}>🔄 Recalcular da minha posição</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: { flex: 1, marginRight: 8 },
  headerTitulo: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  headerEndereco: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  fechar: { color: colors.textSecondary, fontSize: 13, fontWeight: 'bold' },
  mapaWrap: { flex: 1, backgroundColor: colors.surfaceAlt },
  pinDestino: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandGold,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDestinoTexto: { fontSize: 15 },
  pontoEu: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#fff',
    opacity: 0.9,
  },
  semMapa: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  semMapaTexto: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 220,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardCentro: { alignItems: 'center', paddingVertical: 12 },
  cardInfo: { color: colors.textSecondary, marginTop: 8, fontSize: 13 },
  manobra: { color: colors.text, fontSize: 17, fontWeight: 'bold', lineHeight: 22 },
  manobraVia: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  chegada: { color: colors.brandLime, fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  erro: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  botaoRecalcular: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  botaoRecalcularTexto: { color: colors.text, fontSize: 13, fontWeight: 'bold' },
});
