/**
 * components/FaseTimeline.tsx — Timeline das FASES (mesma do painel admin — issue 8)
 *
 * Mostra a Trilha da Excelência (F0 → ENTREGUE) com o status de cada fase
 * a partir do histórico do backend (GET /orcamentos/:id/fase/historico).
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { FaseHistorico } from '../api/orcamentos';

const FASE_ORDER = [
  'F0_ABORDAGEM',
  'F0_ORCAMENTO',
  'F0_APROVACAO',
  'F1_AGENDADO',
  'F1_COLETADO',
  'F1_DOCUMENTACAO',
  'F2_F3_PRODUCAO',
  'SECAGEM',
  'F4_DEVOLUCAO',
  'ENTREGUE',
];

const FASE_LABEL: Record<string, string> = {
  F0_ABORDAGEM: 'Abordagem',
  F0_ORCAMENTO: 'Orçamento',
  F0_APROVACAO: 'Aprovado',
  F1_AGENDADO: 'Coleta Agendada',
  F1_COLETADO: 'Coletado',
  F1_DOCUMENTACAO: 'Documentação',
  F2_F3_PRODUCAO: 'Lavagem',
  SECAGEM: 'Secagem',
  F4_DEVOLUCAO: 'Devolução',
  ENTREGUE: 'Entregue',
};

function fmtData(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FaseTimeline({
  faseAtual,
  historico,
}: {
  faseAtual: string;
  historico: FaseHistorico[];
}) {
  const porFase = new Map<string, FaseHistorico>();
  for (const h of historico) {
    porFase.set(h.fase, h);
  }

  return (
    <View>
      {FASE_ORDER.map((fase, i) => {
        const h = porFase.get(fase);
        const concluida = !!h?.concluidoEm;
        const atual = fase === faseAtual;
        return (
          <View key={fase} style={styles.linha}>
            <View
              style={[
                styles.bolinha,
                concluida ? styles.bolinhaOk : atual ? styles.bolinhaAtual : styles.bolinhaPendente,
              ]}
            >
              {concluida ? (
                <Text style={styles.check}>✓</Text>
              ) : (
                <Text style={styles.num}>{i + 1}</Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.label, atual && styles.labelAtual]}>
                {FASE_LABEL[fase] ?? fase.replace(/_/g, ' ')}
              </Text>
              {concluida && h?.concluidoEm ? (
                <Text style={styles.data}>{fmtData(h.concluidoEm)}</Text>
              ) : atual ? (
                <Text style={styles.data}>Fase atual</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bolinha: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bolinhaOk: { backgroundColor: colors.success },
  bolinhaAtual: { backgroundColor: colors.primary },
  bolinhaPendente: { backgroundColor: colors.surfaceAlt },
  check: { color: '#111827', fontSize: 13, fontWeight: 'bold' },
  num: { color: colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  info: { flex: 1 },
  label: { color: colors.text, fontSize: 14 },
  labelAtual: { color: colors.active, fontWeight: 'bold' },
  data: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
