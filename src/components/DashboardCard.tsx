/**
 * components/DashboardCard.tsx — Card reutilizável do dashboard (F8)
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  icon: string;
  title: string;
  /** Valor principal (contagem). null → mostra "—" (dados indisponíveis) */
  value: number | string | null;
  subtitle?: string;
  accent?: string;
}

export default function DashboardCard({ icon, title, value, subtitle, accent = colors.primary }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value === null ? '—' : value}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
    minWidth: '47%',
  },
  icon: {
    fontSize: 20,
    marginBottom: 8,
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
