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
import { colors, primaryGradient } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { minhasColetas, minhasEntregas } from '../api/orcamentos';
import DashboardCard from '../components/DashboardCard';
import type { Perfil } from '../types';

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Administrador',
  motorista: 'Motorista',
  expedicao: 'Expedição',
  lavagem: 'Lavagem',
  secagem: 'Secagem',
};

interface CardDef {
  icon: string;
  title: string;
  value: number | string | null;
  subtitle?: string;
  accent: string;
}

/** Cards por perfil — doc 3_TELAS */
function cardsDoPerfil(perfil: Perfil, dados: { coletas: number | null; entregas: number | null }): CardDef[] {
  switch (perfil) {
    case 'motorista':
      return [
        {
          icon: '🚚',
          title: 'Minha Rota de Hoje',
          value: null,
          subtitle: 'Sprint 3 (RouteXL)',
          accent: colors.primary,
        },
        {
          icon: '📦',
          title: 'Coletas Pendentes',
          value: dados.coletas,
          subtitle: 'Atribuídas a você',
          accent: colors.brandLime,
        },
        {
          icon: '📦',
          title: 'Entregas Pendentes',
          value: dados.entregas,
          subtitle: 'Atribuídas a você',
          accent: colors.brandGold,
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
        { icon: '🧼', title: 'Na Fila de Lavagem', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.primary },
        { icon: '🫧', title: 'Lavando Agora', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.info },
        { icon: '✅', title: 'Finalizados Hoje', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.success },
      ];
    case 'secagem':
      return [
        { icon: '☀️', title: 'Na Fila de Secagem', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.primary },
        { icon: '🌬️', title: 'Secando Agora', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.brandGold },
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
        { icon: '📊', title: 'Resumo Geral', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.primary },
        { icon: '💰', title: 'Financeiro', value: null, subtitle: 'Somente admin · Aguardando B18', accent: colors.brandGold },
        { icon: '👥', title: 'Todos os Perfis', value: null, subtitle: 'Aguardando kanban (B18)', accent: colors.brandPink },
      ];
  }
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const perfilAtivo = useAppStore((s) => s.perfilAtivo);
  const setPerfilAtivo = useAppStore((s) => s.setPerfilAtivo);

  const perfis = user?.perfis ?? [];
  const perfil = perfilAtivo ?? perfis[0] ?? 'admin';

  const [dados, setDados] = useState<{ coletas: number | null; entregas: number | null }>({
    coletas: null,
    entregas: null,
  });
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  }, [carregarDados]);

  const cards = cardsDoPerfil(perfil, dados);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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

      {/* Cards por perfil */}
      <View style={styles.grid}>
        {cards.map((card, i) => (
          <DashboardCard key={`${card.title}-${i}`} {...card} />
        ))}
      </View>

      {dados.coletas === null && perfis.includes('motorista') && (
        <Text style={styles.nota}>ℹ️ Não foi possível carregar as pendências. Verifique sua conexão.</Text>
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
  nota: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
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
