/**
 * screens/Dashboard.tsx — Dashboard por perfil (base — F8 evoluirá)
 *
 * Sprint 1: mostra o usuário logado e os perfis; os cards por perfil
 * (rota, coletas, entregas, filas de lavagem/secagem, expedição)
 * serão implementados nos Sprints 2–5.
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, primaryGradient } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import type { Perfil } from '../types';

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Administrador',
  motorista: 'Motorista',
  expedicao: 'Expedição',
  lavagem: 'Lavagem',
  secagem: 'Secagem',
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const perfilAtivo = useAppStore((s) => s.perfilAtivo);
  const setPerfilAtivo = useAppStore((s) => s.setPerfilAtivo);

  const perfis = user?.perfis ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>LU</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.hello}>Olá, {user?.nome?.split(' ')[0] ?? 'usuário'} 👋</Text>
          <Text style={styles.subtitle}>
            {perfis.length > 0
              ? PERFIL_LABEL[perfis[0]] ?? perfis[0]
              : 'Operador'}
          </Text>
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
                style={[styles.chip, perfilAtivo === p && styles.chipOn]}
                onPress={() => setPerfilAtivo(p)}
              >
                <Text style={[styles.chipText, perfilAtivo === p && styles.chipTextOn]}>
                  {PERFIL_LABEL[p] ?? p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Placeholder dos cards por perfil (Sprints 2–5) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚧 Em construção</Text>
        <Text style={styles.cardText}>
          Os cards do dashboard por perfil (rota do dia, coletas, entregas, filas de
          produção) serão liberados nos próximos sprints do app.
        </Text>
      </View>

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
  cardText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
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
  logout: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
