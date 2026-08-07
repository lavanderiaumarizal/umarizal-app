/**
 * screens/RelatorioDia.tsx — Relatório do Dia (F30)
 *
 * - Totais: coletas, entregas, por tipo de serviço, tempo médio por fase
 * - Admin vê valores; demais perfis apenas quantidades (o backend filtra)
 * - Botão "Compartilhar resumo" (Share API do RN)
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
  Share,
} from 'react-native';
import { colors, primaryGradient } from '../theme';
import { getRelatorioDia, type RelatorioDia } from '../api/relatorio';
import { useAuthStore } from '../store/authStore';
import Preco from '../components/Preco';

function fmtDataBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Formata moeda para o texto de compartilhamento (só admin usa) */
function fmtMoeda(v?: number): string {
  if (v === undefined) return '';
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export default function RelatorioDiaScreen() {
  const user = useAuthStore((s) => s.user);
  const ehAdmin = (user?.perfis ?? []).includes('admin');

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
      const r = await getRelatorioDia(iso);
      setRelatorio(r);
    } catch {
      setErro('Não foi possível carregar o relatório.');
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

  async function compartilhar() {
    if (!relatorio) return;
    const linhas = [
      `📊 Relatório — ${fmtDataBR(relatorio.data)}`,
      '',
      `📦 Coletas: ${relatorio.totalColetas}`,
      `🚚 Entregas: ${relatorio.totalEntregas}`,
      ehAdmin && relatorio.valorColetas !== undefined
        ? `💰 Valor coletado: ${fmtMoeda(relatorio.valorColetas)}`
        : '',
      ehAdmin && relatorio.valorEntregas !== undefined
        ? `💰 Valor entregue: ${fmtMoeda(relatorio.valorEntregas)}`
        : '',
      '',
      '🧺 Por tipo de serviço:',
      ...relatorio.porTipoServico.map(
        (t) =>
          `  • ${t.categoria}: ${t.quantidade}${ehAdmin && t.valor !== undefined ? ` (${fmtMoeda(t.valor)})` : ''}`,
      ),
      '',
      '⏱️ Tempo médio por fase:',
      ...relatorio.tempoMedioFase.map((f) => `  • ${f.label}: ${f.minutosMedios} min`),
    ].filter(Boolean);

    await Share.share({ message: linhas.join('\n') }).catch(() => undefined);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro || !relatorio) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
        <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar()}>
          <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={styles.data}>📅 {fmtDataBR(relatorio.data)}</Text>

      {/* Totais */}
      <View style={styles.grid}>
        <View style={[styles.card, { borderLeftColor: colors.brandLime }]}>
          <Text style={styles.cardValue}>{relatorio.totalColetas}</Text>
          <Text style={styles.cardLabel}>📦 Coletas</Text>
          <Preco value={relatorio.valorColetas} style={styles.cardValor} />
        </View>
        <View style={[styles.card, { borderLeftColor: colors.brandGold }]}>
          <Text style={styles.cardValue}>{relatorio.totalEntregas}</Text>
          <Text style={styles.cardLabel}>🚚 Entregas</Text>
          <Preco value={relatorio.valorEntregas} style={styles.cardValor} />
        </View>
      </View>

      {/* Por tipo de serviço */}
      <Text style={styles.secao}>🧺 Por tipo de serviço</Text>
      <View style={styles.card}>
        {relatorio.porTipoServico.length === 0 ? (
          <Text style={styles.vazio}>Nenhum serviço coletado hoje.</Text>
        ) : (
          relatorio.porTipoServico.map((t) => (
            <View key={t.categoria} style={styles.linha}>
              <Text style={styles.linhaLabel}>{t.categoria}</Text>
              <View style={styles.linhaRight}>
                <Text style={styles.linhaQtd}>{t.quantidade}</Text>
                <Preco value={t.valor} style={styles.linhaValor} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Tempo médio por fase */}
      <Text style={styles.secao}>⏱️ Tempo médio por fase</Text>
      <View style={styles.card}>
        {relatorio.tempoMedioFase.length === 0 ? (
          <Text style={styles.vazio}>Sem dados de fases concluídas hoje.</Text>
        ) : (
          relatorio.tempoMedioFase.map((f) => (
            <View key={f.fase} style={styles.linha}>
              <Text style={styles.linhaLabel}>{f.label}</Text>
              <Text style={styles.linhaQtd}>{f.minutosMedios} min</Text>
            </View>
          ))
        )}
      </View>

      {/* Compartilhar */}
      <TouchableOpacity style={styles.compartilhar} onPress={() => void compartilhar()}>
        <Text style={styles.compartilharText}>📤 Compartilhar resumo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  botaoPrimario: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold' },
  data: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
  },
  cardValue: { color: colors.text, fontSize: 26, fontWeight: 'bold' },
  cardLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  cardValor: { color: colors.brandGold, fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  secao: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  vazio: { color: colors.textMuted, fontSize: 13, paddingVertical: 8 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  linhaLabel: { color: colors.text, fontSize: 14 },
  linhaRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linhaQtd: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  linhaValor: { color: colors.brandGold, fontSize: 13, fontWeight: '600' },
  compartilhar: {
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 24,
  },
  compartilharText: { color: colors.active, fontWeight: 'bold', fontSize: 14 },
});
