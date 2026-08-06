/**
 * components/EtapaTimeline.tsx — Timeline vertical das 12 etapas (F11)
 *
 * - Concluída: ✓ verde · Em andamento: ● azul (destaque) · Pendente: ○ cinza
 * - Mostra responsável e data de conclusão quando disponíveis
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { EtapasResponse } from '../api/etapas';

function formatarData(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function EtapaTimeline({ etapas }: { etapas: EtapasResponse }) {
  const lista: Array<{ numero: number; nome: string; status: string; responsavel?: string; concluidoEm?: string | null; observacoes?: string | null }> = [];

  for (let i = 1; i <= 12; i++) {
    const e = etapas[`etapa_${i}` as keyof EtapasResponse];
    if (e) lista.push({ numero: e.etapa, ...e });
  }

  return (
    <View style={styles.container}>
      {lista.map((etapa, index) => {
        const isLast = index === lista.length - 1;
        const concluida = etapa.status === 'concluida';
        const emAndamento = etapa.status === 'em_andamento';

        return (
          <View key={etapa.numero} style={styles.item}>
            {/* Coluna do indicador */}
            <View style={styles.indicadorCol}>
              <View
                style={[
                  styles.indicador,
                  concluida && styles.indicadorConcluida,
                  emAndamento && styles.indicadorAndamento,
                ]}
              >
                {concluida && <Text style={styles.check}>✓</Text>}
                {emAndamento && <Text style={styles.dot}>●</Text>}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.linha,
                    concluida && styles.linhaConcluida,
                  ]}
                />
              )}
            </View>

            {/* Conteúdo */}
            <View style={[styles.conteudo, emAndamento && styles.conteudoAtivo]}>
              <View style={styles.tituloRow}>
                <Text
                  style={[
                    styles.numero,
                    concluida && styles.numeroConcluida,
                    emAndamento && styles.numeroAndamento,
                  ]}
                >
                  {etapa.numero.toString().padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.nome,
                    concluida && styles.nomeConcluida,
                    emAndamento && styles.nomeAndamento,
                  ]}
                >
                  {etapa.nome}
                </Text>
              </View>

              {(etapa.responsavel || etapa.concluidoEm) && (
                <Text style={styles.meta}>
                  {etapa.responsavel ? `por ${etapa.responsavel}` : ''}
                  {etapa.responsavel && etapa.concluidoEm ? ' · ' : ''}
                  {etapa.concluidoEm ? formatarData(etapa.concluidoEm) : ''}
                </Text>
              )}

              {etapa.observacoes ? (
                <Text style={styles.obs} numberOfLines={2}>
                  {etapa.observacoes}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
  },
  indicadorCol: {
    width: 28,
    alignItems: 'center',
  },
  indicador: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  indicadorConcluida: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  indicadorAndamento: {
    borderColor: colors.primary,
    backgroundColor: colors.activeBg,
  },
  check: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dot: {
    color: colors.primary,
    fontSize: 10,
  },
  linha: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
    minHeight: 18,
  },
  linhaConcluida: {
    backgroundColor: colors.success,
  },
  conteudo: {
    flex: 1,
    paddingBottom: 16,
    paddingLeft: 10,
  },
  conteudoAtivo: {
    backgroundColor: colors.activeBg,
    borderRadius: 8,
    padding: 8,
    marginLeft: 4,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numero: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  numeroConcluida: {
    color: colors.success,
  },
  numeroAndamento: {
    color: colors.primary,
  },
  nome: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  nomeConcluida: {
    color: colors.text,
  },
  nomeAndamento: {
    color: colors.active,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  obs: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
