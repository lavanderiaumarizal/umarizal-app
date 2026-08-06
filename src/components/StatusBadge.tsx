/**
 * components/StatusBadge.tsx — Badge de status (F13)
 *
 * pendente → cinza · em_andamento → azul · concluida → verde
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: colors.textSecondary, bg: colors.surfaceAlt },
  em_andamento: { label: 'Em andamento', color: colors.active, bg: colors.activeBg },
  concluida: { label: 'Concluída', color: colors.success, bg: 'rgba(34, 197, 94, 0.12)' },
};

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status ?? '—',
    color: colors.textSecondary,
    bg: colors.surfaceAlt,
  };

  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
