/**
 * screens/Almoxarifado.tsx — Almoxarifado/Estoque (F26) + Flag de Carregamento (F27)
 *
 * Substitui a planilha manual de entrada/saída de tapetes.
 * - Busca textual + filtros (status, período, tipo)
 * - Cards: código, cliente, medidas+tipo, datas de coleta/entrega
 * - Checkbox "CARREGAR" → POST/DELETE /api/orcamentos/:id/carregar (B11/B12)
 * - SEM preços (regra do doc 6)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, primaryGradient } from '../theme';
import { getAlmoxarifado, carregarOrcamento, descarregarOrcamento, type TapeteAlmoxarifado } from '../api/orcamentos';

const STATUS_OPCOES = [
  { key: '', label: 'Todos' },
  { key: 'coletado', label: 'Coletados' },
  { key: 'carregado', label: 'Carregados' },
  { key: 'entregue', label: 'Entregues' },
];

const PERIODO_OPCOES = [
  { key: '', label: 'Todo período' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
];

const TIPO_OPCOES = [
  { key: '', label: 'Todos tipos' },
  { key: 'Tapete', label: 'Tapetes' },
  { key: 'Enxoval', label: 'Enxoval' },
  { key: 'Outros', label: 'Outros' },
];

function fmtData(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Data local no formato YYYY-MM-DD (para o filtro do backend) */
function fmtDataISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDataBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AlmoxarifadoScreen() {
  const insets = useSafeAreaInsets();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState(() => new Date());

  const [tapetes, setTapetes] = useState<TapeteAlmoxarifado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const carregar = useCallback(async (buscaAtual: string = busca) => {
    setLoading(true);
    setErro(null);
    try {
      const lista = await getAlmoxarifado({
        q: buscaAtual || undefined,
        status: status || undefined,
        periodo: periodo || undefined,
        tipo: tipo || undefined,
        data: fmtDataISO(data),
      });
      setTapetes(lista);
    } catch {
      setErro('Não foi possível carregar o almoxarifado.');
    } finally {
      setLoading(false);
    }
  }, [busca, status, periodo, tipo, data]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  /** F27 — toggle de carregamento (B11/B12) */
  async function toggleCarregar(tapete: TapeteAlmoxarifado) {
    if (toggling) return;
    setToggling(tapete.id);
    try {
      if (tapete.carregamentoVeiculo) {
        await descarregarOrcamento(tapete.id);
      } else {
        await carregarOrcamento(tapete.id);
      }
      await carregar();
    } catch {
      setErro('Não foi possível alterar o carregamento.');
    } finally {
      setToggling(null);
    }
  }

  return (
    <View style={styles.container}>
      {/* Busca */}
      <TextInput
        style={styles.busca}
        placeholder="🔍 Buscar por código, cliente ou endereço..."
        placeholderTextColor={colors.textMuted}
        value={busca}
        onChangeText={setBusca}
        onSubmitEditing={() => void carregar(busca)}
        returnKeyType="search"
      />

      {/* Filtros */}
      <View style={styles.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroRow}>
          {STATUS_OPCOES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, status === s.key && styles.chipOn]}
              onPress={() => setStatus(s.key)}
            >
              <Text style={[styles.chipText, status === s.key && styles.chipTextOn]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
          {PERIODO_OPCOES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, periodo === p.key && styles.chipOn]}
              onPress={() => setPeriodo(p.key)}
            >
              <Text style={[styles.chipText, periodo === p.key && styles.chipTextOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
          {TIPO_OPCOES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, tipo === t.key && styles.chipOn]}
              onPress={() => setTipo(t.key)}
            >
              <Text style={[styles.chipText, tipo === t.key && styles.chipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Data da rota (o que carregar na kombi no dia) */}
      <View style={styles.dataRow}>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => setData(new Date(data.getTime() - 86400000))}
        >
          <Text style={styles.dataBtnText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dataCentro} onPress={() => setData(new Date())}>
          <Text style={styles.dataTitulo}>🚚 Carregar no dia</Text>
          <Text style={styles.dataTexto}>{fmtDataBR(data)}</Text>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar()}>
            <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={styles.total}>{tapetes.length} tapetes</Text>

          {tapetes.length === 0 ? (
            <Text style={styles.vazio}>Nenhum tapete encontrado.</Text>
          ) : (
            tapetes.map((tapete) => {
              const carregado = !!tapete.carregamentoVeiculo;
              const entregue = tapete.faseAtual === 'ENTREGUE';
              const servicos = tapete.itens
                .map((i) => {
                  const medidas =
                    i.largura && i.comprimento ? ` (${i.largura}×${i.comprimento}m)` : '';
                  return `${i.servicoNome ?? 'Serviço'}${medidas}`;
                })
                .join(' · ');

              return (
                <View key={tapete.id} style={[styles.card, entregue && styles.cardEntregue]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.codigo}>{tapete.codigo}</Text>
                    <View style={[styles.statusDot, entregue ? styles.dotEntregue : carregado ? styles.dotCarregado : styles.dotColetado]} />
                  </View>

                  <Text style={styles.cliente} numberOfLines={1}>{tapete.cliente.nome}</Text>
                  <Text style={styles.servico} numberOfLines={2}>{servicos || '—'}</Text>

                  <View style={styles.datas}>
                    <Text style={styles.dataLabel}>Coleta: {fmtData(tapete.dataColetaAgendada)}</Text>
                    <Text style={styles.dataLabel}>Entrega: {fmtData(tapete.dataEntregaAgendada)}</Text>
                  </View>

                  {carregado && (
                    <Text style={styles.carregadoInfo}>
                      ✓ Carregado em {fmtData(tapete.carregamentoVeiculo!.carregadoEm)} ({tapete.carregamentoVeiculo!.veiculo}) · {tapete.carregamentoVeiculo!.usuario.nome}
                    </Text>
                  )}

                  {!entregue && (
                    <TouchableOpacity
                      style={[styles.checkboxRow, toggling === tapete.id && styles.botaoDisabled]}
                      onPress={() => void toggleCarregar(tapete)}
                      disabled={toggling !== null}
                    >
                      <View style={[styles.checkbox, carregado && styles.checkboxOn]}>
                        {carregado && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, carregado && styles.checkboxLabelOn]}>
                        {carregado ? 'CARREGADO' : 'CARREGAR'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  busca: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    margin: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  filtros: { marginBottom: 4 },
  filtroRow: { paddingHorizontal: 12, gap: 8 },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dataBtn: { paddingHorizontal: 14, paddingVertical: 4 },
  dataBtnText: { color: colors.active, fontSize: 16, fontWeight: 'bold' },
  dataCentro: { alignItems: 'center' },
  dataTitulo: { color: colors.active, fontSize: 11, fontWeight: 'bold' },
  dataTexto: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.activeBg, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  chipTextOn: { color: colors.active, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  botaoPrimario: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold' },
  lista: { padding: 12, paddingBottom: 32 },
  total: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  vazio: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    padding: 12,
    marginBottom: 10,
  },
  cardEntregue: { borderLeftColor: colors.success, opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  codigo: { color: colors.active, fontSize: 12, fontWeight: 'bold' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotColetado: { backgroundColor: colors.info },
  dotCarregado: { backgroundColor: colors.warning },
  dotEntregue: { backgroundColor: colors.success },
  cliente: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  servico: { color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },
  datas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dataLabel: { color: colors.textMuted, fontSize: 11 },
  carregadoInfo: { color: colors.warning, fontSize: 11, marginTop: 6, fontWeight: '600' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.warning, borderColor: colors.warning },
  checkboxCheck: { color: '#111827', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: 'bold' },
  checkboxLabelOn: { color: colors.warning },
  botaoDisabled: { opacity: 0.5 },
});
