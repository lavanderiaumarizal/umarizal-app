/**
 * screens/RotaDoDia.tsx — Rota do Dia do motorista (F14)
 *
 * - Seletor de data (◀ ▶ + Hoje)
 * - Carrega rota: GET /api/routexl/rota-do-dia (B22/B23)
 * - Sem rota salva → mensagem + "🔄 Gerar Rota" (eventos → optimize → save-route)
 * - Paradas ordenadas: ordem, tipo, endereço, horário, status
 * - Paradas concluídas: check verde + desabilitadas (sem botões)
 * - Botões por parada: 📍 Maps (deep link) · Coletar (B9) / Entregar (B10)
 * - Pull-to-refresh
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { colors, primaryGradient } from '../theme';
import {
  getRotaDoDia,
  getEventosDia,
  optimizeRota,
  saveRota,
  enderecoDoEvento,
  type RotaDoDia,
  type Stop,
} from '../api/routexl';
import { coletaRealizada, entregaRealizada } from '../api/orcamentos';
import CameraCapture from '../components/CameraCapture';
import SignaturePad from '../components/SignaturePad';
import MapaRota from '../components/MapaRota';

/** Formata YYYY-MM-DD local */
function fmtData(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDataBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

type AcaoModal =
  | { tipo: 'coleta'; stop: Stop }
  | { tipo: 'entrega'; stop: Stop }
  | null;

export default function RotaDoDiaScreen() {
  const [data, setData] = useState(() => new Date());
  const [rota, setRota] = useState<RotaDoDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [acao, setAcao] = useState<AcaoModal>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const carregar = useCallback(async (dataAlvo: Date) => {
    setLoading(true);
    setErro(null);
    try {
      const r = await getRotaDoDia(fmtData(dataAlvo));
      setRota(r);
    } catch {
      setErro('Não foi possível carregar a rota. Verifique sua conexão.');
      setRota(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar(data);
  }, [data, carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar(data);
    setRefreshing(false);
  }, [data, carregar]);

  /** F14.2 — Gerar rota: eventos do dia → RouteXL optimize → save-route */
  async function gerarRota() {
    setGerando(true);
    setErro(null);
    try {
      const eventos = await getEventosDia(fmtData(data));
      const eventosDia = eventos.filter((e) => e.data === fmtData(data) && e.orcamentoId && e.tipo !== 'FIXO' as any);

      if (eventosDia.length === 0) {
        setErro('Nenhum evento de coleta/entrega para esta data.');
        return;
      }

      const stops = eventosDia.map((e) => ({
        orcamentoId: e.orcamentoId,
        tipo: e.tipo,
        endereco: enderecoDoEvento(e),
        codigo: e.codigo,
        servicetime: e.tempoPermanencia ?? 20,
      }));

      const otimizada = await optimizeRota(stops, {});
      await saveRota(fmtData(data), otimizada, stops);
      await carregar(data);
    } catch {
      setErro('Não foi possível gerar a rota (verifique o limite do RouteXL).');
    } finally {
      setGerando(false);
    }
  }

  /** Abre o Google Maps na parada */
  function navegarParada(stop: Stop) {
    const endereco = stop.endereco?.logradouro ?? '';
    const url = `https://maps.google.com/?daddr=${encodeURIComponent(endereco)}`;
    void Linking.openURL(url).catch(() => undefined);
  }

  // ============================================================
  // Fluxos de ação (coleta B9 / entrega B10)
  // ============================================================
  function abrirColeta(stop: Stop) {
    setFotos([]);
    setAssinatura(null);
    setObservacoes('');
    setAcao({ tipo: 'coleta', stop });
  }

  function abrirEntrega(stop: Stop) {
    setFotos([]);
    setAssinatura(null);
    setObservacoes('');
    setAcao({ tipo: 'entrega', stop });
  }

  async function confirmarAcao() {
    if (!acao || !assinatura) return;
    setEnviando(true);
    try {
      if (acao.tipo === 'coleta') {
        await coletaRealizada(acao.stop.orcamentoId!, {
          fotos,
          assinatura,
          observacoes: observacoes || undefined,
        });
      } else {
        await entregaRealizada(acao.stop.orcamentoId!, {
          assinatura,
          observacoes: observacoes || undefined,
        });
      }
      setAcao(null);
      await carregar(data); // B23 → parada volta como concluída
    } catch {
      setErro('Não foi possível concluir a ação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const dataStr = fmtData(data);

  return (
    <View style={styles.container}>
      {/* Cabeçalho + seletor de data */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => setData(new Date(data.getTime() - 86400000))}
        >
          <Text style={styles.dataBtnText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dataCentro}>
          <Text style={styles.title}>Rota do Dia</Text>
          <TouchableOpacity onPress={() => setData(new Date())}>
            <Text style={styles.dataTexto}>{fmtDataBR(dataStr)}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => setData(new Date(data.getTime() + 86400000))}
        >
          <Text style={styles.dataBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : erro ? (
        <View style={styles.center}>
          <Text style={styles.erro}>{erro}</Text>
          <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar(data)}>
            <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : !rota ? (
        // Nenhuma rota salva para a data
        <View style={styles.center}>
          <Text style={styles.semRota}>🚚 Nenhuma rota para esta data.</Text>
          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={() => void gerarRota()}
            disabled={gerando}
          >
            {gerando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoPrimarioText}>🔄 Gerar Rota</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={styles.resumo}>
            {rota.stops.length} paradas · {rota.totalDistanceKm ?? 0} km ·{' '}
            {rota.totalDurationMinutes ?? 0} min
          </Text>

          <TouchableOpacity style={styles.botaoMapa} onPress={() => setMostrarMapa(true)}>
            <Text style={styles.botaoMapaText}>🗺️ Ver Mapa da Rota</Text>
          </TouchableOpacity>

          {rota.stops.map((stop) => {
            const concluida = stop.concluido;
            const ehColeta = stop.tipo === 'COLETA';
            return (
              <View
                key={stop.ordem}
                style={[styles.parada, concluida && styles.paradaConcluida]}
              >
                <View style={styles.paradaHeader}>
                  <View style={[styles.ordemBadge, concluida && styles.ordemBadgeConcluida]}>
                    {concluida ? <Text style={styles.check}>✓</Text> : <Text style={styles.ordemText}>{stop.ordem}</Text>}
                  </View>
                  <View style={styles.paradaInfo}>
                    <Text style={[styles.paradaTipo, { color: ehColeta ? colors.brandLime : colors.brandGold }]}>
                      {ehColeta ? 'COLETA' : 'ENTREGA'} · {stop.horarioChegada ?? '--:--'}
                    </Text>
                    <Text style={styles.paradaEndereco} numberOfLines={2}>
                      {stop.endereco?.logradouro ?? 'Endereço não informado'}
                    </Text>
                  </View>
                </View>

                {!concluida && (
                  <View style={styles.acoes}>
                    <TouchableOpacity style={styles.botaoMaps} onPress={() => navegarParada(stop)}>
                      <Text style={styles.botaoMapsText}>📍 Maps</Text>
                    </TouchableOpacity>
                    {ehColeta ? (
                      <TouchableOpacity
                        style={[styles.botaoAcao, styles.botaoColeta]}
                        onPress={() => abrirColeta(stop)}
                        disabled={!stop.orcamentoId}
                      >
                        <Text style={styles.botaoAcaoText}>Coletar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.botaoAcao, styles.botaoEntrega]}
                        onPress={() => abrirEntrega(stop)}
                        disabled={!stop.orcamentoId}
                      >
                        <Text style={styles.botaoAcaoText}>Entregar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ============================================================
          Modal de COELTA: câmera → fotos + assinatura
      ============================================================ */}
      <Modal visible={acao?.tipo === 'coleta' && !mostrarCamera} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📦 Registrar Coleta</Text>
            <Text style={styles.modalStop}>{acao?.stop.endereco?.logradouro}</Text>

            <View style={styles.fotoRow}>
              {fotos.map((f, i) => (
                <View key={i} style={styles.fotoThumbWrap}>
                  {/* eslint-disable-next-line react-native/no-inline-styles */}
                  <View style={[styles.fotoThumb, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={styles.fotoCount}>{i + 1}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.botaoCamera} onPress={() => setMostrarCamera(true)}>
                <Text style={styles.botaoCameraText}>📷 + Foto</Text>
              </TouchableOpacity>
            </View>

            <SignaturePad
              onOK={setAssinatura}
              onEmpty={() => setAssinatura(null)}
            />

            <TextInput
              style={styles.obsInput}
              placeholder="Observações (opcional)"
              placeholderTextColor={colors.textMuted}
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setAcao(null)} disabled={enviando}>
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoConfirmar, (!assinatura || enviando) && styles.botaoDisabled]}
                onPress={() => void confirmarAcao()}
                disabled={!assinatura || enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoConfirmarText}>Confirmar coleta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Câmera (foto da coleta) */}
      <Modal visible={mostrarCamera} animationType="slide" onRequestClose={() => setMostrarCamera(false)}>
        <CameraCapture
          onCapture={(base64) => {
            setFotos((f) => [...f, base64]);
            setMostrarCamera(false);
          }}
          onClose={() => setMostrarCamera(false)}
        />
      </Modal>

      {/* ============================================================
          Modal de ENTREGA: assinatura
      ============================================================ */}
      <Modal visible={acao?.tipo === 'entrega'} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚚 Registrar Entrega</Text>
            <Text style={styles.modalStop}>{acao?.stop.endereco?.logradouro}</Text>

            <SignaturePad onOK={setAssinatura} onEmpty={() => setAssinatura(null)} />

            <TextInput
              style={styles.obsInput}
              placeholder="Observações (opcional)"
              placeholderTextColor={colors.textMuted}
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setAcao(null)} disabled={enviando}>
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoConfirmar, (!assinatura || enviando) && styles.botaoDisabled]}
                onPress={() => void confirmarAcao()}
                disabled={!assinatura || enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoConfirmarText}>Confirmar entrega</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Mapa da rota (F14.1) */}
      <Modal visible={mostrarMapa} animationType="slide" onRequestClose={() => setMostrarMapa(false)}>
        <View style={styles.mapaWrap}>
          <View style={styles.mapaHeader}>
            <Text style={styles.mapaTitulo}>🗺️ Rota do Dia</Text>
            <TouchableOpacity onPress={() => setMostrarMapa(false)}>
              <Text style={styles.mapaFechar}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          {rota ? <MapaRota waypoints={rota.allWaypoints} /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataBtn: { padding: 10 },
  dataBtnText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  dataCentro: { alignItems: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  dataTexto: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  semRota: { color: colors.textSecondary, fontSize: 15, marginBottom: 16 },
  botaoPrimario: {
    backgroundColor: primaryGradient[1],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 180,
  },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  lista: { padding: 12, paddingBottom: 32 },
  resumo: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  botaoMapa: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoMapaText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  mapaWrap: { flex: 1, backgroundColor: colors.background },
  mapaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapaTitulo: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  mapaFechar: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  parada: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  paradaConcluida: { opacity: 0.55 },
  paradaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ordemBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordemBadgeConcluida: { backgroundColor: colors.success },
  ordemText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  check: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  paradaInfo: { flex: 1 },
  paradaTipo: { fontSize: 11, fontWeight: 'bold' },
  paradaEndereco: { color: colors.text, fontSize: 13, marginTop: 3, lineHeight: 18 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  botaoMaps: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botaoMapsText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  botaoAcao: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, flex: 1, alignItems: 'center' },
  botaoColeta: { backgroundColor: colors.brandLime },
  botaoEntrega: { backgroundColor: colors.brandGold },
  botaoAcaoText: { color: '#111827', fontWeight: 'bold', fontSize: 13 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  modalStop: { color: colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 8 },
  fotoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  fotoThumbWrap: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden' },
  fotoThumb: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fotoCount: { color: colors.textSecondary, fontWeight: 'bold' },
  botaoCamera: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCameraText: { color: colors.primary, fontSize: 10, textAlign: 'center' },
  obsInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    minHeight: 48,
    marginTop: 10,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botaoCancelar: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoCancelarText: { color: colors.textSecondary, fontWeight: 'bold' },
  botaoConfirmar: {
    flex: 2,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoConfirmarText: { color: '#fff', fontWeight: 'bold' },
  botaoDisabled: { opacity: 0.5 },
});
