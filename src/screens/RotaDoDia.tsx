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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, primaryGradient } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getRotaDoDia,
  getEventosDia,
  optimizeRota,
  saveRota,
  enderecoDoEvento,
  limparEndereco,
  type RotaDoDia,
  type Stop,
} from '../api/routexl';
import { coletaRealizada, entregaRealizada } from '../api/orcamentos';
import CameraCapture from '../components/CameraCapture';
import MapaRota from '../components/MapaRota';
import type { RootStackParamList } from '../navigation/AppNavigator';

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

/** Duração em minutos → "2h 30min" / "45min" (fix 3 — tempo em horas) */
function fmtDuracao(min?: number | null): string {
  const total = Math.round(min ?? 0);
  if (total <= 0) return '0min';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
}

/** Horários sugeridos no modal interativo (sem teclado — fix 2) */
const HORARIOS_SUGERIDOS = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '13:00'];

/** "HH:MM" → minutos desde 00:00 (null se inválido) */
function minutosDe(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

/** Minutos → "HH:MM" (com wrap de 24h) */
function minutosParaHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Minutos atuais no fuso de São Paulo (independe do fuso do aparelho) */
function agoraMinutosSP(): number {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

type AcaoModal =
  | { tipo: 'coleta'; stop: Stop }
  | { tipo: 'entrega'; stop: Stop }
  | null;

export default function RotaDoDiaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState(() => new Date());
  const [rota, setRota] = useState<RotaDoDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gerando, setGerando] = useState(false);
  // ⏱️ Recálculo ORS pós-coleta/entrega (best-effort, sem mudar a ordem)
  const [recalculando, setRecalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [acao, setAcao] = useState<AcaoModal>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  // Modal de horário de saída — usado tanto pelo "Gerar Rota" (eventos do dia)
  // quanto pelo "Re-otimizar" (paradas atuais), como no painel admin
  const [mostrarHorarioSaida, setMostrarHorarioSaida] = useState(false);
  const [horarioSaida, setHorarioSaida] = useState('08:00');

  /** Converte as paradas carregadas para o formato do RouteXL (endereço limpo + código) */
  function stopsDaRota(paradas: Stop[]) {
    return paradas.map((s) => {
      const logradouro = s.endereco?.logradouro ?? '';
      // Remove o prefixo "CODIGO - " apenas quando o logradouro começa com ele.
      // Paradas FIXO agora chegam com o endereço REAL (sem prefixo) — o código
      // volta do campo codigo (ex.: "FIXO-Qualimais"), como no gerar original.
      const prefixo = s.codigo ? `${s.codigo} - ` : '';
      const endereco = prefixo && logradouro.startsWith(prefixo)
        ? logradouro.slice(prefixo.length)
        : logradouro;
      return {
        orcamentoId: s.orcamentoId,
        tipo: s.tipo,
        endereco,
        codigo: s.codigo || s.orcamentoId || '',
        servicetime: s.tempoServicoMinutos ?? 20,
      };
    });
  }

  const carregar = useCallback(async (dataAlvo: Date): Promise<RotaDoDia | null> => {
    setLoading(true);
    setErro(null);
    try {
      const r = await getRotaDoDia(fmtData(dataAlvo));
      setRota(r);
      return r;
    } catch {
      setErro('Não foi possível carregar a rota. Verifique sua conexão.');
      setRota(null);
      return null;
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

  /** F14.2 — Gerar rota: eventos do dia → RouteXL optimize → save-route
   *  Mesmo fluxo do painel admin: endereço "Rua, N - CEP" (sem complemento),
   *  inclui endereços FIXO e usa o horário de saída da lavanderia.
   */
  async function gerarRota() {
    const m = horarioSaida.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
      setErro('Informe o horário no formato HH:MM (ex.: 08:00).');
      return;
    }
    const minutos = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    setGerando(true);
    setErro(null);
    try {
      const eventos = await getEventosDia(fmtData(data));
      const eventosDia = eventos.filter((e) => e.data === fmtData(data));

      if (eventosDia.length === 0) {
        setErro('Nenhum evento de coleta/entrega para esta data.');
        return;
      }

      const stops = eventosDia.map((e) => ({
        orcamentoId: e.orcamentoId || `fixo-${e.id}`,
        tipo: e.tipo,
        endereco: enderecoDoEvento(e),
        codigo: e.codigo,
        servicetime: e.tempoPermanencia ?? 20,
      }));

      const otimizada = await optimizeRota(stops, { date: fmtData(data), startTimeMinutes: minutos });
      await saveRota(fmtData(data), otimizada, stops);
      await carregar(data);
      setMostrarHorarioSaida(false);
    } catch (err: any) {
      const msgBackend = err?.response?.data?.error?.message || err?.response?.data?.message;
      setErro(msgBackend || 'Não foi possível gerar a rota.');
    } finally {
      setGerando(false);
    }
  }

  /** F14.3 — Flip: inverte a ordem das paradas (skipOptimisation: true) */
  async function flipRota() {
    if (!rota || rota.stops.length === 0) return;
    const m = horarioSaida.match(/^(\d{1,2}):(\d{2})$/);
    const minutos = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : undefined;
    setGerando(true);
    setErro(null);
    try {
      const invertidos = stopsDaRota([...rota.stops].reverse());
      const otimizada = await optimizeRota(invertidos, {
        date: fmtData(data),
        startTimeMinutes: minutos,
        skipOptimisation: true,
      });
      await saveRota(fmtData(data), otimizada, invertidos);
      await carregar(data);
    } catch {
      setErro('Não foi possível inverter a rota.');
    } finally {
      setGerando(false);
    }
  }

  /** F14.4 — Salvar a rota ATUAL sem regenerar (evita distorção/coletas sumindo) */
  async function salvarRotaAtual() {
    if (!rota || rota.stops.length === 0) return;
    setGerando(true);
    setErro(null);
    try {
      const otimizada = {
        tourId: '',
        feasible: true,
        totalDistanceKm: rota.totalDistanceKm ?? 0,
        totalDurationMin: rota.totalDurationMinutes ?? 0,
        waypoints: rota.allWaypoints.map((w) => ({
          ordem: w.ordem,
          address: w.enderecoCompleto ?? '',
          lat: w.latitude ?? 0,
          lng: w.longitude ?? 0,
          arrivalTime: w.horarioChegada ?? '',
          distance: w.distanciaKm ?? 0,
          type: w.tipo,
        })),
        rawResponse: {},
        geometry: rota.geometry ?? null,
      };
      const stops = stopsDaRota(rota.stops);
      await saveRota(fmtData(data), otimizada, stops);
    } catch {
      setErro('Não foi possível salvar a rota.');
    } finally {
      setGerando(false);
    }
  }

  /** ⏱️ Re-otimizar como o painel admin: horário de saída → optimize → save */
  async function reotimizar() {
    if (!rota || rota.stops.length === 0) return;
    const m = horarioSaida.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
      setErro('Informe o horário no formato HH:MM (ex.: 08:00).');
      return;
    }
    const minutos = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    setGerando(true);
    setErro(null);
    try {
      const stops = stopsDaRota(rota.stops);
      const otimizada = await optimizeRota(stops, { date: fmtData(data), startTimeMinutes: minutos });
      await saveRota(fmtData(data), otimizada, stops);
      await carregar(data);
      setMostrarHorarioSaida(false);
    } catch (err: any) {
      const msgBackend = err?.response?.data?.error?.message || err?.response?.data?.message;
      setErro(msgBackend || 'Não foi possível re-otimizar a rota.');
    } finally {
      setGerando(false);
    }
  }

  /** ⏱️ Pós-coleta/entrega — recalcula os tempos da rota com o ORS (motor ativo)
   *  SEM alterar a ordem estabelecida (ordem normal ou flip são preservadas —
   *  skipOptimisation). As paradas pendentes são reancoradas no "agora" para
   *  que o Portal do Cliente sempre veja um horário previsto atualizado.
   *  Concluídas mantêm o horário original e a saída real do depot é preservada.
   */
  async function recalcularTemposRota(base?: RotaDoDia | null) {
    const atual = base ?? rota;
    if (!atual || atual.stops.length === 0) return;
    if (!atual.stops.some((s) => !s.concluido)) return; // rota concluída — nada a atualizar
    setRecalculando(true);
    try {
      const stops = stopsDaRota(atual.stops);
      const otimizada = await optimizeRota(stops, {
        date: fmtData(data),
        skipOptimisation: true,
      });

      // Códigos das paradas já concluídas (horário original é preservado)
      const concluidoPorCodigo = new Set(
        atual.stops.filter((s) => s.concluido).map((s) => s.codigo || s.orcamentoId || ''),
      );
      const horarioAntigoPorCodigo = new Map(
        atual.stops.map((s) => [s.codigo || s.orcamentoId || '', s.horarioChegada] as const),
      );
      const depotInicioAntigo =
        atual.allWaypoints.find((w) => w.tipo === 'DEPOT')?.horarioChegada ?? null;

      // 1ª parada pendente na nova resposta → âncora "agora"
      const agora = agoraMinutosSP();
      let deslocamento: number | null = null;
      for (const wp of otimizada?.waypoints ?? []) {
        if (wp.type === 'DEPOT') continue;
        const codigo = (wp.address ?? '').split(' - ')[0] ?? '';
        if (!concluidoPorCodigo.has(codigo)) {
          deslocamento = agora - (minutosDe(wp.arrivalTime) ?? agora);
          break;
        }
      }

      otimizada.waypoints = (otimizada?.waypoints ?? []).map((wp: any, idx: number) => {
          if (wp.type === 'DEPOT') {
            // Saída real (depot inicial) preservada; retorno desloca junto
            if (idx === 0 && depotInicioAntigo) {
              return { ...wp, arrivalTime: depotInicioAntigo };
            }
            if (deslocamento != null) {
              const m = minutosDe(wp.arrivalTime);
              if (m != null) return { ...wp, arrivalTime: minutosParaHHMM(m + deslocamento) };
            }
            return wp;
          }
          const codigo = (wp.address ?? '').split(' - ')[0] ?? '';
          if (concluidoPorCodigo.has(codigo)) {
            const antigo = horarioAntigoPorCodigo.get(codigo);
            if (antigo) return { ...wp, arrivalTime: antigo };
          }
          if (deslocamento != null) {
            const m = minutosDe(wp.arrivalTime);
            if (m != null) return { ...wp, arrivalTime: minutosParaHHMM(m + deslocamento) };
          }
          return wp;
        },
      );

      await saveRota(fmtData(data), otimizada, stops);
      await carregar(data);
    } catch {
      // Recálculo é best-effort — a rota atual permanece válida
    } finally {
      setRecalculando(false);
    }
  }

  /** Abre o Google Maps na parada (endereço sem o prefixo do código).
   *  Paradas FIXO: o backend já envia o endereço REAL do cadastro — nunca
   *  "FIXO-Nome" (fix 4). */
  function navegarParada(stop: Stop) {
    const logradouro = stop.endereco?.logradouro ?? '';
    const ehFixo = (stop.orcamentoId ?? '').startsWith('fixo-');
    const endereco = ehFixo ? logradouro : limparEndereco(logradouro);
    const url = `https://maps.google.com/?daddr=${encodeURIComponent(endereco)}`;
    void Linking.openURL(url).catch(() => undefined);
  }

  /** Ajusta o horário de saída em minutos (steppers do modal interativo — fix 2) */
  function ajustarHorario(delta: number) {
    const m = horarioSaida.match(/^(\d{1,2}):(\d{2})$/);
    const atual = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 8 * 60;
    const novo = Math.min(23 * 60 + 45, Math.max(0, atual + delta));
    setHorarioSaida(
      `${String(Math.floor(novo / 60)).padStart(2, '0')}:${String(novo % 60).padStart(2, '0')}`,
    );
  }

  /** Fluxos de ação (coleta B9 / entrega B10) — sem assinatura: o login é a assinatura */
  function abrirColeta(stop: Stop) {
    setFotos([]);
    setObservacoes('');
    setAcao({ tipo: 'coleta', stop });
  }

  function abrirEntrega(stop: Stop) {
    setFotos([]);
    setObservacoes('');
    setAcao({ tipo: 'entrega', stop });
  }

  async function confirmarAcao() {
    if (!acao) return;
    setEnviando(true);
    try {
      if (acao.tipo === 'coleta') {
        await coletaRealizada(acao.stop.orcamentoId!, {
          fotos,
          observacoes: observacoes || undefined,
        });
      } else {
        await entregaRealizada(acao.stop.orcamentoId!, {
          fotos,
          observacoes: observacoes || undefined,
        });
      }
      setAcao(null);
      const novaRota = await carregar(data); // B23 → parada volta como concluída
      // ⏱️ Recalcula horários previstos com o ORS (ordem preservada) — o Portal
      // do Cliente passa a exibir a previsão atualizada para as próximas paradas
      await recalcularTemposRota(novaRota);
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
            onPress={() => setMostrarHorarioSaida(true)}
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
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Fix 3 — tempo em horas + saída/retorno (DEPOTs da rota) */}
          {(() => {
            const depots = rota.allWaypoints.filter((w) => w.tipo === 'DEPOT');
            const saida = depots[0]?.horarioChegada ?? null;
            const retorno = depots.length > 1 ? (depots[depots.length - 1]?.horarioChegada ?? null) : null;
            return (
              <>
                <Text style={styles.resumo}>
                  {rota.stops.length} paradas · {Math.round(rota.totalDistanceKm ?? 0)} km ·{' '}
                  {fmtDuracao(rota.totalDurationMinutes)}
                </Text>
                {(saida || retorno) && (
                  <Text style={styles.resumoHorarios}>
                    🕐 Saída {saida ?? '––:––'} · retorno previsto {retorno ?? '––:––'}
                  </Text>
                )}
                {recalculando && (
                  <Text style={styles.resumoHorarios}>
                    ⏱️ Atualizando horários previstos (ORS)…
                  </Text>
                )}
              </>
            );
          })()}

          <TouchableOpacity style={styles.botaoMapa} onPress={() => setMostrarMapa(true)}>
            <Text style={styles.botaoMapaText}>🗺️ Ver Mapa da Rota</Text>
          </TouchableOpacity>

          {/* F14.2/F14.3/F14.4 — Gerar, Re-otimizar, Flip e Salvar rota */}
          <View style={styles.rotaAcoes}>
            <TouchableOpacity
              style={[styles.botaoAcaoRota, (gerando || recalculando) && styles.botaoDisabled]}
              onPress={() => setMostrarHorarioSaida(true)}
              disabled={gerando || recalculando}
            >
              <Text style={styles.botaoAcaoRotaText}>🔄 Gerar Rota</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoAcaoRota, (gerando || recalculando) && styles.botaoDisabled]}
              onPress={() => setMostrarHorarioSaida(true)}
              disabled={gerando || recalculando}
            >
              <Text style={styles.botaoAcaoRotaText}>⏱️ Re-otimizar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rotaAcoes}>
            <TouchableOpacity
              style={[styles.botaoFlip, (gerando || recalculando) && styles.botaoDisabled]}
              onPress={() => void flipRota()}
              disabled={gerando || recalculando}
            >
              <Text style={styles.botaoFlipText}>🔄 Flip (inverter ordem)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoSalvar, (gerando || recalculando) && styles.botaoDisabled]}
              onPress={() => void salvarRotaAtual()}
              disabled={gerando || recalculando}
            >
              <Text style={styles.botaoSalvarText}>💾 Salvar Rota</Text>
            </TouchableOpacity>
          </View>

          {rota.stops.map((stop) => {
            const concluida = stop.concluido;
            const ehColeta = stop.tipo === 'COLETA';
            // Endereços fixos não têm ordem de serviço — sem botões de confirmação,
            // mas com botão de mapa (navegação pelo endereço)
            const ehFixo = (stop.orcamentoId ?? '').startsWith('fixo-');
            return (
              <TouchableOpacity
                key={stop.ordem}
                style={[styles.parada, concluida && styles.paradaConcluida]}
                onPress={() => {
                  if (stop.orcamentoId && !ehFixo) {
                    navigation.navigate('Detalhes', { orcamentoId: stop.orcamentoId });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.paradaHeader}>
                  <View style={[styles.ordemBadge, concluida && styles.ordemBadgeConcluida]}>
                    {concluida ? <Text style={styles.check}>✓</Text> : <Text style={styles.ordemText}>{stop.ordem}</Text>}
                  </View>
                  <View style={styles.paradaInfo}>
                    <Text style={[styles.paradaTipo, { color: ehColeta ? colors.brandLime : colors.brandGold }]}>
                      {ehColeta ? 'COLETA' : 'ENTREGA'} · {stop.horarioChegada ?? '--:--'}
                    </Text>
                    {stop.cliente?.nome ? (
                      <Text style={styles.paradaCliente} numberOfLines={1}>👤 {stop.cliente.nome}</Text>
                    ) : null}
                    <Text style={styles.paradaEndereco} numberOfLines={2}>
                      {limparEndereco(stop.endereco?.logradouro ?? 'Endereço não informado')}
                    </Text>
                    {/* Complemento: apenas informativo (apto, bloco...) — não vai ao RouteXL */}
                    {stop.cliente?.complemento ? (
                      <Text style={styles.paradaComplemento} numberOfLines={1}>🚪 {stop.cliente.complemento}</Text>
                    ) : null}
                  </View>
                </View>

                {!concluida && (
                  <View style={styles.acoes}>
                    <TouchableOpacity style={styles.botaoMaps} onPress={() => navegarParada(stop)}>
                      <Text style={styles.botaoMapsText}>📍 Maps</Text>
                    </TouchableOpacity>
                    {!ehFixo &&
                      (ehColeta ? (
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
                          <Text style={styles.botaoAcaoText}>Entregue</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ============================================================
          Modal de COLETA: câmera opcional → confirma (o login é a assinatura)
      ============================================================ */}
      <Modal visible={acao?.tipo === 'coleta' && !mostrarCamera} transparent animationType="slide">
        <View style={[styles.modalWrap, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📦 Confirmar Coleta</Text>
            <Text style={styles.modalStop}>{limparEndereco(acao?.stop.endereco?.logradouro ?? '')}</Text>
            <Text style={styles.modalDica}>O registro usa seu login como assinatura.</Text>

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
                <Text style={styles.botaoCameraText}>📷 + Foto (opcional)</Text>
              </TouchableOpacity>
            </View>

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
                style={[styles.botaoConfirmar, enviando && styles.botaoDisabled]}
                onPress={() => void confirmarAcao()}
                disabled={enviando}
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
          Modal de ENTREGA: câmera opcional → confirma (o login é a assinatura)
      ============================================================ */}
      <Modal visible={acao?.tipo === 'entrega' && !mostrarCamera} transparent animationType="slide">
        <View style={[styles.modalWrap, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚚 Confirmar Entrega</Text>
            <Text style={styles.modalStop}>{limparEndereco(acao?.stop.endereco?.logradouro ?? '')}</Text>
            <Text style={styles.modalDica}>O registro usa seu login como assinatura.</Text>

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
                <Text style={styles.botaoCameraText}>📷 + Foto (opcional)</Text>
              </TouchableOpacity>
            </View>

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
                style={[styles.botaoConfirmar, enviando && styles.botaoDisabled]}
                onPress={() => void confirmarAcao()}
                disabled={enviando}
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
        <View style={[styles.mapaWrap, { paddingBottom: insets.bottom }]}>
          <View style={styles.mapaHeader}>
            <Text style={styles.mapaTitulo}>🗺️ Rota do Dia</Text>
            <TouchableOpacity onPress={() => setMostrarMapa(false)}>
              <Text style={styles.mapaFechar}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          {rota ? (
            <MapaRota waypoints={rota.allWaypoints} geometry={rota.geometry} />
          ) : null}
        </View>
      </Modal>

      {/* ⏱️ Horário de saída — modal interativo (chips + steppers, sem teclado — fix 2).
          Usado pelo Gerar Rota e pelo Re-otimizar (fluxo do painel admin) */}
      <Modal
        visible={mostrarHorarioSaida}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarHorarioSaida(false)}
      >
        <View style={[styles.modalWrap, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⏱️ Horário de Saída</Text>
            <Text style={styles.modalStop}>
              {rota
                ? 'Ajuste o horário de saída da lavanderia para re-otimizar a rota:'
                : 'Ajuste o horário de saída da lavanderia (início da rota):'}
            </Text>

            <Text style={styles.horarioDisplay}>{horarioSaida}</Text>

            {/* Steppers — ajuste fino sem teclado */}
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => ajustarHorario(-60)} disabled={gerando}>
                <Text style={styles.stepperText}>−1h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => ajustarHorario(-15)} disabled={gerando}>
                <Text style={styles.stepperText}>−15min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => ajustarHorario(15)} disabled={gerando}>
                <Text style={styles.stepperText}>+15min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => ajustarHorario(60)} disabled={gerando}>
                <Text style={styles.stepperText}>+1h</Text>
              </TouchableOpacity>
            </View>

            {/* Chips de horários sugeridos */}
            <View style={styles.horarioChipsRow}>
              {HORARIOS_SUGERIDOS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.horarioChip, horarioSaida === h && styles.horarioChipOn]}
                  onPress={() => setHorarioSaida(h)}
                  disabled={gerando}
                >
                  <Text style={[styles.horarioChipText, horarioSaida === h && styles.horarioChipTextOn]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setMostrarHorarioSaida(false)} disabled={gerando}>
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoConfirmar, gerando && styles.botaoDisabled]}
                onPress={() => (rota ? void reotimizar() : void gerarRota())}
                disabled={gerando}
              >
                {gerando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoConfirmarText}>{rota ? 'Re-otimizar' : 'Gerar Rota'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  dataBtnText: { color: colors.primary, fontSize: 21, fontWeight: 'bold' },
  dataCentro: { alignItems: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  dataTexto: { color: colors.textSecondary, fontSize: 15, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erro: { color: colors.danger, fontSize: 16, textAlign: 'center', marginBottom: 12 },
  semRota: { color: colors.textSecondary, fontSize: 17, marginBottom: 16 },
  botaoPrimario: {
    backgroundColor: primaryGradient[1],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 180,
  },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  lista: { padding: 12, paddingBottom: 32 },
  resumo: { color: colors.textSecondary, fontSize: 14, marginBottom: 4 },
  resumoHorarios: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  botaoMapa: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoMapaText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  rotaAcoes: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  botaoFlip: {
    flex: 1,
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoFlipText: { color: colors.active, fontWeight: 'bold', fontSize: 14 },
  botaoAcaoRota: {
    flex: 1,
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoAcaoRotaText: { color: colors.active, fontWeight: 'bold', fontSize: 15 },
  botaoSalvar: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoSalvarText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 },
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
  mapaTitulo: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  mapaFechar: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
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
  ordemText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  check: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  paradaInfo: { flex: 1 },
  paradaTipo: { fontSize: 13, fontWeight: 'bold' },
  paradaEndereco: { color: colors.textSecondary, fontSize: 14, marginTop: 2, lineHeight: 20 },
  paradaComplemento: { color: colors.textSecondary, fontSize: 14, marginTop: 2, fontWeight: '600' },
  paradaCliente: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 3 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  botaoMaps: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botaoMapsText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  botaoAcao: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, flex: 1, alignItems: 'center' },
  botaoColeta: { backgroundColor: colors.brandLime },
  botaoEntrega: { backgroundColor: colors.brandGold },
  botaoAcaoText: { color: '#111827', fontWeight: 'bold', fontSize: 15 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  modalDica: { color: colors.textMuted, fontSize: 14, marginTop: 2, marginBottom: 6 },
  modalStop: { color: colors.textSecondary, fontSize: 14, marginTop: 2, marginBottom: 8 },
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
  botaoCameraText: { color: colors.primary, fontSize: 12, textAlign: 'center' },
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
    fontSize: 15,
  },
  horarioDisplay: {
    color: colors.text,
    fontSize: 46,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
  },
  stepperRow: { flexDirection: 'row', gap: 8 },
  stepperBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  stepperText: { color: colors.active, fontWeight: 'bold', fontSize: 15 },
  horarioChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  horarioChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  horarioChipOn: { backgroundColor: colors.activeBg, borderColor: colors.primary },
  horarioChipText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  horarioChipTextOn: { color: colors.active, fontWeight: 'bold' },
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
