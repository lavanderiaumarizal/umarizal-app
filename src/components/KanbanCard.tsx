/**
 * components/KanbanCard.tsx — Card do kanban (F12)
 *
 * Mostra: código, cliente, serviço + medidas, badge de status e etapa atual.
 * SEM valores financeiros (o backend já filtra para não-admin).
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import StatusBadge from './StatusBadge';
import Preco from './Preco';
import { ETAPA_NOME } from '../api/kanban';
import type { KanbanItem } from '../api/kanban';
import type { ItemResumo } from '../api/orcamentos';

/** Área do item em m² (largura × comprimento × quantidade), formatada pt-BR */
function areaItemM2(it: ItemResumo): string | null {
  const l = Number(it.largura);
  const c = Number(it.comprimento);
  if (!l || !c) return null;
  const area = l * c * (it.quantidade || 1);
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

export default function KanbanCard({ item, onPress }: { item: KanbanItem; onPress?: () => void }) {
  const { orcamento, etapaAtual, etapaStatus } = item;

  // Um tapete por linha, com área em m² em vez das medidas largura×comprimento
  const servicos = orcamento.itens.map((it) => {
    const area = areaItemM2(it);
    if (area) {
      return it.quantidade > 1
        ? `${it.servicoNome ?? 'Serviço'} — ${area} no total`
        : `${it.servicoNome ?? 'Serviço'} — ${area}`;
    }
    return it.quantidade > 1
      ? `${it.servicoNome ?? 'Serviço'} (×${it.quantidade})`
      : (it.servicoNome ?? 'Serviço');
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.header}>
        <Text style={styles.codigo}>{orcamento.codigo}</Text>
        <StatusBadge status={etapaStatus} />
      </View>

      <Text style={styles.cliente} numberOfLines={1}>
        {orcamento.cliente.nome}
      </Text>

      {/* Um tapete por linha, com área em m² em vez de medidas */}
      <View style={styles.servicosWrap}>
        {(servicos.length ? servicos : ['—']).map((s, i) => (
          <Text key={i} style={styles.servico} numberOfLines={2}>
            • {s}
          </Text>
        ))}
      </View>

      {/* Preço — somente admin (backend filtra para os demais) */}
      {typeof (orcamento as any).valorTotal === 'number' && (
        <Preco value={(orcamento as any).valorTotal} style={styles.valor} />
      )}

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
    fontSize: 14,
    fontWeight: 'bold',
  },
  cliente: {
    color: colors.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  servicosWrap: {
    marginTop: 4,
    gap: 2,
  },
  servico: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  etapa: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  valor: {
    color: colors.brandGold,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
