/**
 * screens/MinhasColetasEntregas.tsx — Lista de pendências do motorista (Q4/issue 4)
 *
 * - Coletas (B13) ou Entregas (B14) atribuídas ao motorista logado
 * - Cards: código, cliente, endereço, telefone, data agendada
 * - Sem valores financeiros (doc 6)
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
  Linking,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, primaryGradient } from '../theme';
import { minhasColetas, minhasEntregas, type OrcamentoResumo } from '../api/orcamentos';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Tipo = 'coleta' | 'entrega';

function fmtData(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Data local no formato YYYY-MM-DD (filtro do backend) */
function fmtDataISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDataBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MinhasColetasEntregasScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'MinhasColetas'>;
}) {
  const { tipo } = route.params;
  const insets = useSafeAreaInsets();
  const ehColeta = tipo === 'coleta';

  const [itens, setItens] = useState<OrcamentoResumo[]>([]);
  const [transportador, setTransportador] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Fix 7 — filtro de data com padrão HOJE ("ver todas" remove o filtro)
  const [data, setData] = useState<Date | null>(() => new Date());

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      if (ehColeta) {
        const res = await minhasColetas(data ? fmtDataISO(data) : undefined);
        setItens(res.data?.coletas ?? []);
        setTransportador(res.data?.transportador?.nome ?? null);
      } else {
        const res = await minhasEntregas(data ? fmtDataISO(data) : undefined);
        setItens(res.data?.entregas ?? []);
        setTransportador(res.data?.transportador?.nome ?? null);
      }
    } catch {
      setErro('Não foi possível carregar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [ehColeta, data]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  function enderecoCompleto(o: OrcamentoResumo): string {
    const c = o.cliente;
    const partes = [
      c.endereco,
      c.numero ? `, ${c.numero}` : '',
      c.complemento ? ` ${c.complemento}` : '',
      c.bairro ? ` - ${c.bairro}` : '',
      c.cidade ? ` - ${c.cidade}${c.uf ? `-${c.uf}` : ''}` : '',
    ];
    return partes.join('').trim();
  }

  function navegar(o: OrcamentoResumo) {
    const endereco = enderecoCompleto(o);
    if (!endereco) return;
    void Linking.openURL(`https://maps.google.com/?daddr=${encodeURIComponent(endereco)}`).catch(() => undefined);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={styles.titulo}>{ehColeta ? '📦 Minhas Coletas' : '🚚 Minhas Entregas'}</Text>
      <Text style={styles.sub}>
        {transportador ? `Transportador: ${transportador}` : 'Atribuídas a você'}
      </Text>

      {/* Filtro de data (fix 7) — padrão hoje */}
      <View style={styles.dataRow}>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => setData((p) => (p ? new Date(p.getTime() - 86400000) : new Date()))}
        >
          <Text style={styles.dataBtnText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dataCentro}
          onPress={() => setData((p) => (p ? null : new Date()))}
        >
          <Text style={styles.dataTexto}>{data ? `📅 ${fmtDataBR(data)}` : '📅 Todas as datas'}</Text>
          <Text style={styles.dataDica}>{data ? 'Toque para ver todas' : 'Toque para ver só um dia'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => setData((p) => (p ? new Date(p.getTime() + 86400000) : new Date()))}
        >
          <Text style={styles.dataBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {erro ? (
        <View style={styles.centerBox}>
          <Text style={styles.erro}>{erro}</Text>
          <TouchableOpacity style={styles.botao} onPress={() => void carregar()}>
            <Text style={styles.botaoText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : itens.length === 0 ? (
        <Text style={styles.vazio}>
          {transportador
            ? data
              ? `Nenhuma ${tipo === 'coleta' ? 'coleta' : 'entrega'} para ${fmtDataBR(data)}. 🎉`
              : `Nenhuma ${tipo === 'coleta' ? 'coleta' : 'entrega'} pendente. 🎉`
            : 'Você ainda não está vinculado a um transportador. Peça ao admin para configurar.'}
        </Text>
      ) : (
        itens.map((o) => (
          <View key={o.id} style={styles.card}>
            <Text style={styles.codigo}>{o.codigo}</Text>
            <Text style={styles.cliente} numberOfLines={1}>{o.cliente.nome}</Text>
            <Text style={styles.endereco} numberOfLines={2}>{enderecoCompleto(o) || 'Endereço não informado'}</Text>
            <Text style={styles.data}>
              {ehColeta ? '🕐 Coleta: ' : '🕐 Entrega: '}
              {ehColeta ? fmtData(o.dataColetaAgendada) : fmtData(o.dataEntregaAgendada)}
            </Text>
            {o.cliente.telefone ? (
              <Text style={styles.telefone}>📞 {o.cliente.telefone}</Text>
            ) : null}
            <TouchableOpacity style={styles.maps} onPress={() => navegar(o)}>
              <Text style={styles.mapsText}>📍 Navegar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  centerBox: { alignItems: 'center', paddingVertical: 32 },
  titulo: { color: colors.text, fontSize: 21, fontWeight: 'bold' },
  sub: { color: colors.textSecondary, fontSize: 15, marginTop: 2, marginBottom: 16 },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  dataBtn: { paddingHorizontal: 14, paddingVertical: 4 },
  dataBtnText: { color: colors.active, fontSize: 18, fontWeight: 'bold' },
  dataCentro: { alignItems: 'center' },
  dataTexto: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  dataDica: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  erro: { color: colors.danger, fontSize: 16, textAlign: 'center', marginBottom: 12 },
  botao: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoText: { color: '#fff', fontWeight: 'bold' },
  vazio: { color: colors.textMuted, fontSize: 16, textAlign: 'center', paddingVertical: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    padding: 14,
    marginBottom: 10,
  },
  codigo: { color: colors.active, fontSize: 14, fontWeight: 'bold' },
  cliente: { color: colors.text, fontSize: 17, fontWeight: 'bold', marginTop: 2 },
  endereco: { color: colors.textSecondary, fontSize: 15, marginTop: 4, lineHeight: 21 },
  data: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  telefone: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  maps: {
    alignSelf: 'flex-start',
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  mapsText: { color: colors.active, fontSize: 14, fontWeight: 'bold' },
});
