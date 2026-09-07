/**
 * screens/KanbanProducao.tsx — Kanban por fase (F9) — lógica da Trilha (issue 8)
 *
 * - Colunas = FASES do orçamento na ordem da Trilha da Excelência do painel admin
 *   (F1_AGENDADO → F1_COLETADO → F1_DOCUMENTACAO → F2_F3_PRODUCAO → SECAGEM →
 *   F4_DEVOLUCAO → ENTREGUE), filtradas pelas fases relevantes do perfil.
 * - Cada orçamento aparece na coluna da SUA faseAtual.
 * - Consome GET /api/kanban/:perfil (B18) — o backend já filtra status inválidos.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { kanbanPorPerfil } from '../api/kanban';
import KanbanCard from '../components/KanbanCard';
import type { Perfil } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Admin',
  motorista: 'Motorista',
  expedicao: 'Expedição',
  lavagem: 'Lavagem',
  secagem: 'Secagem',
};

/** Perfis cujas fases têm âncora de data — filtro útil apenas para eles */
const PERFIS_COM_FILTRO_DATA: Perfil[] = ['motorista', 'expedicao', 'admin'];

/** Data local no formato YYYY-MM-DD (filtro do backend) */
function fmtDataISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDataBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Ordem das fases (mesma da Trilha da Excelência do painel admin) */
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

/** Fases visíveis por perfil (espelho do PERFIL_FASES do backend) */
const PERFIL_FASES: Record<Perfil, string[]> = {
  motorista: ['F1_AGENDADO', 'F1_COLETADO', 'F4_DEVOLUCAO'],
  lavagem: ['F2_F3_PRODUCAO'],
  secagem: ['SECAGEM'],
  expedicao: ['F1_COLETADO', 'F1_DOCUMENTACAO', 'F4_DEVOLUCAO'],
  admin: FASE_ORDER,
};

export default function KanbanProducaoScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'Kanban'>;
}) {
  const { perfil } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [dados, setDados] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Fix 8 — filtro de data como na Rota do Dia (motorista já abre em HOJE)
  const [data, setData] = useState<Date | null>(() =>
    perfil === 'motorista' ? new Date() : null,
  );

  const carregar = useCallback(async () => {
    try {
      const res = await kanbanPorPerfil(perfil, data ? fmtDataISO(data) : undefined);
      const colunas = res.data.colunas ?? {};
      // Achata as 3 colunas do backend e reagrupa por FASE (lógica da trilha)
      const itens = [
        ...(colunas.pendente ?? []),
        ...(colunas.em_andamento ?? []),
        ...(colunas.concluida ?? []),
      ];
      const porFase: Record<string, any[]> = {};
      for (const item of itens) {
        const fase = item.orcamento?.faseAtual ?? 'OUTROS';
        (porFase[fase] ??= []).push(item);
      }
      setDados(porFase);
      setErro(null);
    } catch {
      setErro('Não foi possível carregar o kanban. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [perfil, data]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const fasesVisiveis = PERFIL_FASES[perfil] ?? FASE_ORDER;
  const total = Object.values(dados).reduce((acc, itens) => acc + itens.length, 0);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Kanban · {PERFIL_LABEL[perfil]}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.total}>{total} tapetes</Text>
          <TouchableOpacity style={styles.atualizar} onPress={() => void carregar()} disabled={loading}>
            <Text style={styles.atualizarText}>🔄 Atualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtro de data (fix 8) — mesmo padrão da Rota do Dia */}
      {PERFIS_COM_FILTRO_DATA.includes(perfil) && (
        <View style={styles.dataRow}>
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={() => setData((p) => (p ? new Date(p.getTime() - 86400000) : new Date()))}
          >
            <Text style={styles.dataBtnText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dataCentro}
            onPress={() => setData((p) => (p ? null : new Date()))}
          >
            <Text style={styles.dataTexto}>{data ? `📅 ${fmtDataBR(data)}` : '📅 Todas as datas'}</Text>
            <Text style={styles.dataDica}>{data ? 'Toque para ver todas' : 'Toque para ver só um dia'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dataBtn}
            onPress={() => setData((p) => (p ? new Date(p.getTime() + 86400000) : new Date()))}
          >
            <Text style={styles.dataBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : erro ? (
        <View style={styles.center}>
          <Text style={styles.erro}>{erro}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.colunas, { paddingBottom: insets.bottom + 24 }]}
        >
          {fasesVisiveis.map((fase) => {
            const itens = dados[fase] ?? [];
            return (
              <View key={fase} style={styles.coluna}>
                <View style={styles.colunaHeader}>
                  <Text style={styles.colunaLabel}>{FASE_LABEL[fase] ?? fase.replace(/_/g, ' ')}</Text>
                  <View style={styles.contador}>
                    <Text style={styles.contadorText}>{itens.length}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={styles.colunaBody}>
                  {itens.length === 0 ? (
                    <Text style={styles.vazio}>Nenhum tapete</Text>
                  ) : (
                    itens.map((item, i) => (
                      <KanbanCard
                        key={`${item.orcamento.id}-${i}`}
                        item={item}
                        onPress={() => navigation.navigate('Detalhes', { orcamentoId: item.orcamento.id })}
                      />
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {!loading && !erro && total === 0 && (
        <Text style={styles.rodape}>Nenhum tapete em produção neste kanban.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: 'bold',
  },
  total: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  atualizar: {
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  atualizarText: {
    color: colors.active,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.activeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dataBtn: { paddingHorizontal: 14, paddingVertical: 4 },
  dataBtnText: { color: colors.active, fontSize: 18, fontWeight: 'bold' },
  dataCentro: { alignItems: 'center' },
  dataTexto: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  dataDica: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  erro: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  colunas: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  coluna: {
    width: 280,
    marginHorizontal: 6,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '100%',
  },
  colunaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  colunaLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  contador: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.activeBg,
  },
  contadorText: {
    color: colors.active,
    fontSize: 14,
    fontWeight: 'bold',
  },
  colunaBody: {
    padding: 8,
  },
  vazio: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  rodape: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});
