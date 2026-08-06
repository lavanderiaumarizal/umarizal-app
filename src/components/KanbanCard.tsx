/**
 * components/KanbanCard.tsx — Card do kanban (F12)
 *
 * Mostra: código, cliente, serviço + medidas, badge de status e etapa atual.
 * SEM valores financeiros (o backend já filtra para não-admin).
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import StatusBadge from './StatusBadge';
import { ETAPA_NOME } from '../api/kanban';
import type { KanbanItem } from '../api/kanban';

export default function KanbanCard({ item, onPress }: { item: KanbanItem; onPress?: () => void }) {
  const { orcamento, etapaAtual, etapaStatus } = item;

  const servicos = orcamento.itens
    .map((it) => {
      const medidas =
        it.largura && it.comprimento
          ? ` (${it.largura}×${it.comprimento}m)`
          : it.quantidade > 1
            ? ` (×${it.quantidade})`
            : '';
      return `${it.servicoNome ?? 'Serviço'}${medidas}`;
    })
    .join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.header}>
        <Text style={styles.codigo}>{orcamento.codigo}</Text>
        <StatusBadge status={etapaStatus} />
      </View>

      <Text style={styles.cliente} numberOfLines={1}>
        {orcamento.cliente.nome}
      </Text>

      <Text style={styles.servico} numberOfLines={2}>
        {servicos || '—'}
      </Text>

      {etapaAtual !== null && (
        <Text style={styles.etapa}>
          Etapa atual: {ETAPA_NOME[etapaAtual] ?? etapaAtual}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    width: 260,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codigo: {
    color: colors.active,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cliente: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  servico: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  etapa: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
});
