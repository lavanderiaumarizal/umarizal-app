/**
 * components/InspecaoChecklist.tsx — Checklist de Inspeção Final (F28)
 *
 * Itens: Franjas · Bordas · Superfície · Odores — cada um OK/NOK.
 * Só libera a conclusão quando TODOS os itens estiverem OK.
 * Avança a etapa 10 via B6 (concluirEtapa).
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../theme';

export interface ItemInspecao {
  key: string;
  label: string;
}

const ITENS_PADRAO: ItemInspecao[] = [
  { key: 'franjas', label: 'Franjas' },
  { key: 'bordas', label: 'Bordas' },
  { key: 'superficie', label: 'Superfície' },
  { key: 'odores', label: 'Odores' },
];

interface Props {
  onConfirm: (resultados: Record<string, boolean>, observacoes?: string) => void;
  observacoes?: string;
  onSetObservacoes?: (texto: string) => void;
  itens?: ItemInspecao[];
  enviando?: boolean;
}

export default function InspecaoChecklist({
  onConfirm,
  observacoes = '',
  onSetObservacoes,
  itens = ITENS_PADRAO,
  enviando = false,
}: Props) {
  const [resultados, setResultados] = useState<Record<string, boolean | null>>(
    Object.fromEntries(itens.map((i) => [i.key, null])),
  );

  const todosOk = itens.every((i) => resultados[i.key] === true);
  const temNok = itens.some((i) => resultados[i.key] === false);

  function setResultado(key: string, valor: boolean) {
    setResultados((r) => ({ ...r, [key]: valor }));
  }

  return (
    <View>
      <Text style={styles.titulo}>🔍 Checklist de Inspeção</Text>
      <Text style={styles.sub}>Avalie cada item do tapete</Text>

      {itens.map((item) => {
        const valor = resultados[item.key];
        return (
          <View key={item.key} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <View style={styles.botoes}>
              <TouchableOpacity
                style={[styles.botaoStatus, valor === true && styles.botaoOk]}
                onPress={() => setResultado(item.key, true)}
                disabled={enviando}
              >
                <Text style={[styles.botaoStatusText, valor === true && styles.botaoStatusTextOn]}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoStatus, valor === false && styles.botaoNok]}
                onPress={() => setResultado(item.key, false)}
                disabled={enviando}
              >
                <Text style={[styles.botaoStatusText, valor === false && styles.botaoStatusTextNok]}>NOK</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {temNok && (
        <Text style={styles.aviso}>
          ⚠️ Itens NOK impedem a liberação. O tapete deverá ser retornado para a etapa anterior.
        </Text>
      )}

      {onSetObservacoes && (
        <TextInputPlaceholder
          value={observacoes}
          onChangeText={onSetObservacoes}
          disabled={enviando}
        />
      )}

      <TouchableOpacity
        style={[styles.confirmar, !todosOk && styles.confirmarDisabled, enviando && styles.confirmarDisabled]}
        onPress={() => todosOk && onConfirm(resultados as Record<string, boolean>, observacoes)}
        disabled={!todosOk || enviando}
      >
        <Text style={styles.confirmarText}>
          {temNok ? 'Corrigir itens NOK' : todosOk ? '✓ Liberar tapete (concluir inspeção)' : 'Avalie todos os itens'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Input simples (evita import circular do TextInput no corpo do componente)
function TextInputPlaceholder({
  value,
  onChangeText,
  disabled,
}: {
  value: string;
  onChangeText: (t: string) => void;
  disabled: boolean;
}) {
  return (
    <TextInput
      style={styles.obs}
      placeholder="Observações (opcional)"
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline
      editable={!disabled}
    />
  );
}

const styles = StyleSheet.create({
  titulo: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  botoes: { flexDirection: 'row', gap: 8 },
  botaoStatus: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  botaoOk: { backgroundColor: colors.success, borderColor: colors.success },
  botaoNok: { backgroundColor: colors.danger, borderColor: colors.danger },
  botaoStatusText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  botaoStatusTextOn: { color: '#fff' },
  botaoStatusTextNok: { color: '#fff' },
  aviso: { color: colors.danger, fontSize: 12, marginTop: 10 },
  obs: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    minHeight: 56,
    marginTop: 12,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  confirmar: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmarDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.6 },
  confirmarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
