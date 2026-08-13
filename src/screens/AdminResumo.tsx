/**
 * screens/AdminResumo.tsx — Resumo Geral + Financeiro do Admin (issue 4)
 *
 * - Estatísticas gerais: GET /api/orcamentos/stats (dashboardStats)
 * - Relatório do dia: GET /api/relatorio/dia (admin vê valores)
 * - Somente o perfil admin tem acesso (o app esconde a navegação para os demais)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { getDashboardStats, type DashboardStats } from '../api/orcamentos';
import { getRelatorioDia, type RelatorioDia } from '../api/relatorio';
import { useAuthStore } from '../store/authStore';

function fmtMoeda(v?: number): string {
  if (v === undefined || v === null) return '—';
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v?: number): string {
  if (v === undefined || v === null) return '—';
  return `${Math.round(v * 100)}%`;
}

export default function AdminResumoScreen() {
  const user = useAuthStore((s) => s.user);
  const ehAdmin = (user?.perfis ?? []).includes('admin');
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const hoje = new Date();
      const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      const [s, r] = await Promise.all([getDashboardStats(), getRelatorioDia(iso)]);
      setStats(s);
      setRelatorio(r);
    } catch {
      setErro('Não foi possível carregar o resumo. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  if (!ehAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>Acesso restrito ao perfil admin.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro || !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
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
      <Text style={styles.titulo}>📊 Resumo Geral</Text>
      <Text style={styles.sub}>Visão consolidada da lavanderia (somente admin)</Text>

      {/* Bloco 1 — Orçamentos */}
      <Text style={styles.secao}>🧾 Orçamentos</Text>
      <View style={styles.grid}>
        <View style={[styles.card, { borderLeftColor: colors.primary }]}>
          <Text style={styles.cardValue}>{stats.totalOrcamentos}</Text>
          <Text style={styles.cardLabel}>Total</Text>
        </View>
        <View style={[styles.card, { borderLeftColor: colors.success }]}>
          <Text style={styles.cardValue}>{stats.aprovados}</Text>
          <Text style={styles.cardLabel}>Aprovados</Text>
        </View>
        <View style={[styles.card, { borderLeftColor: colors.danger }]}>
          <Text style={styles.cardValue}>{stats.recusados}</Text>
          <Text style={styles.cardLabel}>Recusados</Text>
        </View>
        <View style={[styles.card, { borderLeftColor: colors.info }]}>
          <Text style={styles.cardValue}>{stats.totalClientes}</Text>
          <Text style={styles.cardLabel}>Clientes</Text>
        </View>
      </View>

      {/* Bloco 2 — Financeiro */}
      <Text style={styles.secao}>💰 Financeiro</Text>
      <View style={styles.cardLinha}>
        <Text style={styles.linhaLabel}>Faturamento total</Text>
        <Text style={styles.linhaValor}>{fmtMoeda(stats.faturamentoTotal)}</Text>
      </View>
      <View style={styles.cardLinha}>
        <Text style={styles.linhaLabel}>Faturamento (ativos)</Text>
        <Text style={styles.linhaValor}>{fmtMoeda(stats.faturamento)}</Text>
      </View>
      <View style={styles.cardLinha}>
        <Text style={styles.linhaLabel}>Ticket médio</Text>
        <Text style={styles.linhaValor}>{fmtMoeda(stats.ticketMedio)}</Text>
      </View>
      <View style={styles.cardLinha}>
        <Text style={styles.linhaLabel}>Taxa de conversão</Text>
        <Text style={styles.linhaValor}>{fmtPct(stats.taxaConversao)}</Text>
      </View>

      {/* Bloco 3 — Operação do dia */}
      {relatorio && (
        <>
          <Text style={styles.secao}>📅 Hoje</Text>
          <View style={styles.grid}>
            <View style={[styles.card, { borderLeftColor: colors.brandLime }]}>
              <Text style={styles.cardValue}>{relatorio.totalColetas}</Text>
              <Text style={styles.cardLabel}>Coletas</Text>
            </View>
            <View style={[styles.card, { borderLeftColor: colors.brandGold }]}>
              <Text style={styles.cardValue}>{relatorio.totalEntregas}</Text>
              <Text style={styles.cardLabel}>Entregas</Text>
            </View>
            <View style={[styles.card, { borderLeftColor: colors.brandGold }]}>
              <Text style={styles.cardValue}>{fmtMoeda(relatorio.valorColetas)}</Text>
              <Text style={styles.cardLabel}>Valor coletado</Text>
            </View>
            <View style={[styles.card, { borderLeftColor: colors.brandLime }]}>
              <Text style={styles.cardValue}>{fmtMoeda(relatorio.valorEntregas)}</Text>
              <Text style={styles.cardLabel}>Valor entregue</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  titulo: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 8 },
  secao: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 18, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
  },
  cardValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  cardLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  linhaLabel: { color: colors.textSecondary, fontSize: 14 },
  linhaValor: { color: colors.brandGold, fontSize: 15, fontWeight: 'bold' },
});
