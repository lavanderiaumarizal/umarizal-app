/**
 * screens/Dashboard.tsx — Dashboard por perfil (F8)
 *
 * Cards conforme doc/3_TELAS.md:
 * - Motorista: Rota de Hoje · Coletas Pendentes (B13) · Entregas Pendentes (B14) · Finalizados
 * - Lavagem:   Fila de Lavagem · Lavando Agora · Finalizados
 * - Secagem:   Fila de Secagem · Secando Agora · Finalizados
 * - Expedição: Documentação · Aspiração · Inspeção · Embalagem
 * - Admin:     Resumo Geral · Financeiro · Todos os perfis
 *
 * Cards com "—" aguardam o endpoint de kanban por perfil (B18, Sprint 2 backend).
 * Motorista já usa os endpoints reais B13/B14 (sem valores financeiros).
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, primaryGradient } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { minhasColetas, minhasEntregas } from '../api/orcamentos';
import { getPrevisao, type PrevisaoDia } from '../api/weather';
import DashboardCard from '../components/DashboardCard';
import type { Perfil } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Administrador',
  motorista: 'Motorista',
  expedicao: 'Expedição',
  lavagem: 'Lavagem',
  secagem: 'Secagem',
};

/** Dia da semana curto ("seg", "ter"...) a partir de data ISO */
function fmtDiaSemana(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

/** Rótulo do fator de secagem (mesma lógica da página da estufa do painel) */
function fatorSecagemLabel(f?: 'bom' | 'regular' | 'ruim'): string {
  if (f === 'bom') return '☀️ Bom para secagem';
  if (f === 'regular') return '⛅ Regular para secagem';
  return '🌧️ Ruim para secagem (chuva)';
}

interface CardDef {
  icon: string;
  title: string;
  value: number | string | null;
  subtitle?: string;
  accent: string;
  onPress?: () => void;
}

/** Cards por perfil — doc 3_TELAS */
function cardsDoPerfil(
  perfil: Perfil,
  dados: { coletas: number | null; entregas: number | null },
  onAbrirRota?: () => void,
  onAbrirProducao?: () => void,
  onAbrirColetas?: () => void,
  onAbrirEntregas?: () => void,
  onAbrirResumo?: () => void,
): CardDef[] {
  switch (perfil) {
    case 'motorista':
      return [
        {
          icon: '🚚',
          title: 'Minha Rota de Hoje',
          value: null,
          subtitle: 'RouteXL · tocar para abrir',
          accent: colors.primary,
          onPress: onAbrirRota,
        },
        {
          icon: '📦',
          title: 'Coletas Pendentes',
          value: dados.coletas,
          subtitle: 'Atribuídas a você · tocar para ver',
          accent: colors.brandLime,
          onPress: onAbrirColetas,
        },
        {
          icon: '📦',
          title: 'Entregas Pendentes',
          value: dados.entregas,
          subtitle: 'Atribuídas a você · tocar para ver',
          accent: colors.brandGold,
          onPress: onAbrirEntregas,
        },
        {
          icon: '✅',
          title: 'Finalizados Hoje',
          value: null,
          subtitle: 'Aguardando kanban (B18)',
          accent: colors.success,
        },
      ];
    case 'lavagem':
      return [
        { icon: '🧼', title: 'Na Fila de Lavagem', value: null, subtitle: 'Tocar para abrir', accent: colors.primary, onPress: onAbrirProducao },
        { icon: '🫧', title: 'Lavando Agora', value: null, subtitle: 'Tocar para abrir', accent: colors.info, onPress: onAbrirProducao },
        { icon: '✅', title: 'Finalizados Hoje', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.success },
      ];
    case 'secagem':
      return [
        { icon: '☀️', title: 'Na Fila de Secagem', value: null, subtitle: 'Tocar para abrir', accent: colors.primary, onPress: onAbrirProducao },
        { icon: '🌬️', title: 'Secando Agora', value: null, subtitle: 'Tocar para abrir', accent: colors.brandGold, onPress: onAbrirProducao },
        { icon: '✅', title: 'Finalizados Hoje', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.success },
      ];
    case 'expedicao':
      return [
        { icon: '📋', title: 'Documentação Pendente', value: null, subtitle: 'Etapa 2 · Aguardando B18', accent: colors.primary },
        { icon: '🔄', title: 'Aspiração Pendente', value: null, subtitle: 'Etapa 3 · Aguardando B18', accent: colors.info },
        { icon: '🔍', title: 'Inspeção Pendente', value: null, subtitle: 'Etapa 10 · Aguardando B18', accent: colors.brandGold },
        { icon: '📦', title: 'Embalagem Pendente', value: null, subtitle: 'Etapa 11 · Aguardando B18', accent: colors.brandLime },
      ];
    case 'admin':
      return [
        { icon: '📊', title: 'Resumo Geral', value: null, subtitle: 'Orçamentos e conversão · tocar para abrir', accent: colors.primary, onPress: onAbrirResumo },
        { icon: '💰', title: 'Financeiro', value: null, subtitle: 'Faturamento e ticket · tocar para abrir', accent: colors.brandGold, onPress: onAbrirResumo },
        { icon: '👥', title: 'Todos os Perfis', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.brandPink },
      ];
  }
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const perfilAtivo = useAppStore((s) => s.perfilAtivo);
  const setPerfilAtivo = useAppStore((s) => s.setPerfilAtivo);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const perfis = user?.perfis ?? [];
  const perfil = perfilAtivo ?? perfis[0] ?? 'admin';

  const [dados, setDados] = useState<{ coletas: number | null; entregas: number | null }>({
    coletas: null,
    entregas: null,
  });
  const [previsao, setPrevisao] = useState<PrevisaoDia[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = useCallback(async () => {
    const ehMotorista = perfis.includes('motorista');
    if (!ehMotorista) {
      setDados({ coletas: null, entregas: null });
      return;
    }
    try {
      const [c, e] = await Promise.all([minhasColetas(), minhasEntregas()]);
      setDados({
        coletas: c.data?.total ?? 0,
        entregas: e.data?.total ?? 0,
      });
    } catch {
      setDados({ coletas: null, entregas: null });
    }
  }, [perfis]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const carregarTempo = useCallback(async () => {
    try {
      const p = await getPrevisao(16);
      setPrevisao(p);
    } catch {
      setPrevisao([]);
    }
  }, []);

  useEffect(() => {
    void carregarTempo();
  }, [carregarTempo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([carregarDados(), carregarTempo()]);
    setRefreshing(false);
  }, [carregarDados, carregarTempo]);

  const cards = cardsDoPerfil(
    perfil,
    dados,
    () => navigation.navigate('RotaDoDia'),
    () => navigation.navigate('Producao', { perfil }),
    () => navigation.navigate('MinhasColetas', { tipo: 'coleta' }),
    () => navigation.navigate('MinhasColetas', { tipo: 'entrega' }),
    () => navigation.navigate('AdminResumo'),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>LU</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.hello}>Olá, {user?.nome?.split(' ')[0] ?? 'usuário'} 👋</Text>
          <Text style={styles.subtitle}>{PERFIL_LABEL[perfil] ?? perfil}</Text>
        </View>
      </View>

      {/* Seletor de perfil (multi-perfil) */}
      {perfis.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil ativo</Text>
          <View style={styles.chipRow}>
            {perfis.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, perfil === p && styles.chipOn]}
                onPress={() => setPerfilAtivo(p)}
              >
                <Text style={[styles.chipText, perfil === p && styles.chipTextOn]}>
                  {PERFIL_LABEL[p] ?? p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Previsão do tempo (todos os usuários — issue 8) */}
      {previsao.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌦️ Previsão do Tempo</Text>
          <View style={styles.tempoHoje}>
            <Text style={styles.tempoIcone}>{previsao[0].icone}</Text>
            <View style={styles.tempoInfo}>
              <Text style={styles.tempoMaxMin}>
                {fatorSecagemLabel(previsao[0].fatorSecagem)}
              </Text>
              <Text style={styles.tempoDetalhe}>
                Máx {previsao[0].temperaturaMax ?? '—'}° · Mín {previsao[0].temperaturaMin ?? '—'}° · Chuva{' '}
                {previsao[0].chuvaTotal ?? 0} mm · 💧 {previsao[0].umidadeMax ?? '—'}% · 💨{' '}
                {previsao[0].ventoMax ?? '—'} km/h
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tempoLista}>
            {previsao.map((d, i) => (
              <View key={d.data} style={[styles.tempoDia, i === 0 && styles.tempoDiaHoje]}>
                <Text style={styles.tempoDiaLabel}>{i === 0 ? 'Hoje' : fmtDiaSemana(d.data)}</Text>
                <Text style={styles.tempoDiaIcone}>{d.icone}</Text>
                <Text style={styles.tempoDiaTemp}>{d.temperaturaMax ?? '—'}°</Text>
                <Text style={styles.tempoDiaChuva}>🌧 {d.chuvaTotal ?? 0}mm</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Cards por perfil */}
      <View style={styles.grid}>
        {cards.map((card, i) => (
          <DashboardCard key={`${card.title}-${i}`} {...card} />
        ))}
      </View>

      {dados.coletas === null && perfis.includes('motorista') && (
        <Text style={styles.nota}>ℹ️ Não foi possível carregar as pendências. Verifique sua conexão.</Text>
      )}

      {/* Acesso ao kanban */}
      <TouchableOpacity
        style={styles.kanbanButton}
        onPress={() => navigation.navigate('Kanban', { perfil })}
      >
        <Text style={styles.kanbanButtonText}>🎯 Abrir Kanban de Produção</Text>
      </TouchableOpacity>

      {/* Acesso ao almoxarifado (admin + motorista + expedição) */}
      {perfis.some((p) => ['admin', 'motorista', 'expedicao'].includes(p)) && (
        <TouchableOpacity
          style={styles.almoxarifadoButton}
          onPress={() => navigation.navigate('Almoxarifado')}
        >
          <Text style={styles.almoxarifadoButtonText}>📦 Almoxarifado / Estoque</Text>
        </TouchableOpacity>
      )}

      {/* Acesso ao relatório do dia (todos os perfis — valores só admin) */}
      <TouchableOpacity
        style={styles.relatorioButton}
        onPress={() => navigation.navigate('Relatorio')}
      >
        <Text style={styles.relatorioButtonText}>📊 Relatório do Dia</Text>
      </TouchableOpacity>

      {/* Acesso à documentação de entrada (expedição) */}
      {perfis.some((p) => ['admin', 'expedicao'].includes(p)) && (
        <TouchableOpacity
          style={styles.documentacaoButton}
          onPress={() => navigation.navigate('Documentacao')}
        >
          <Text style={styles.documentacaoButtonText}>📋 Documentação de Entrada</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryGradient[1],
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
  },
  hello: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.activeBg,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextOn: {
    color: colors.active,
    fontWeight: 'bold',
  },
  tempoHoje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  tempoIcone: {
    fontSize: 36,
  },
  tempoInfo: {
    flex: 1,
  },
  tempoMaxMin: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tempoDetalhe: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  tempoLista: {
    marginHorizontal: -16,
  },
  tempoDia: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 4,
    minWidth: 62,
  },
  tempoDiaHoje: {
    borderColor: colors.primary,
    backgroundColor: colors.activeBg,
  },
  tempoDiaLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  tempoDiaIcone: {
    fontSize: 18,
    marginVertical: 4,
  },
  tempoDiaTemp: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  tempoDiaChuva: {
    color: colors.info,
    fontSize: 10,
    marginTop: 2,
  },
  nota: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  kanbanButton: {
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  kanbanButtonText: {
    color: colors.active,
    fontWeight: 'bold',
    fontSize: 14,
  },
  almoxarifadoButton: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  almoxarifadoButtonText: {
    color: colors.warning,
    fontWeight: 'bold',
    fontSize: 14,
  },
  relatorioButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  relatorioButtonText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  documentacaoButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  documentacaoButtonText: {
    color: colors.info,
    fontWeight: 'bold',
    fontSize: 14,
  },
  logout: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
