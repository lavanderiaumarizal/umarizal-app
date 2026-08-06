/**
 * screens/KanbanProducao.tsx — Kanban por fase (F9)
 *
 * - 3 colunas horizontais: Pendente | Em Andamento | Concluído
 * - Cards com código, cliente, serviço, medidas e badge de status
 * - Consome GET /api/kanban/:perfil (B18)
 * - Pull-to-refresh
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../theme';
import { kanbanPorPerfil, ETAPA_NOME } from '../api/kanban';
import KanbanCard from '../components/KanbanCard';
import { useAppStore } from '../store/appStore';
import type { Perfil } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Admin',
  motorista: 'Motorista',
  expedicao: 'Expedição',
  lavagem: 'Lavagem',
  secagem: 'Secagem',
};

const COLUNAS: Array<{
  key: 'pendente' | 'em_andamento' | 'concluida';
  label: string;
  color: string;
  bg: string;
}> = [
  { key: 'pendente', label: 'Pendente', color: colors.textSecondary, bg: colors.surfaceAlt },
  { key: 'em_andamento', label: 'Em Andamento', color: colors.active, bg: colors.activeBg },
  { key: 'concluida', label: 'Concluído', color: colors.success, bg: 'rgba(34, 197, 94, 0.12)' },
];

export default function KanbanProducaoScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'Kanban'>;
}) {
  const { perfil } = route.params;
  const [dados, setDados] = useState<Record<string, any[]>>({
    pendente: [],
    em_andamento: [],
    concluida: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await kanbanPorPerfil(perfil);
      setDados(res.data.colunas);
      setErro(null);
    } catch {
      setErro('Não foi possível carregar o kanban. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [perfil]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  const total = COLUNAS.reduce((acc, c) => acc + (dados[c.key]?.length ?? 0), 0);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Kanban · {PERFIL_LABEL[perfil]}</Text>
        <Text style={styles.total}>{total} tapetes</Text>
      </View>

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
          contentContainerStyle={styles.colunas}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {COLUNAS.map((coluna) => {
            const itens = dados[coluna.key] ?? [];
            return (
              <View key={coluna.key} style={styles.coluna}>
                <View style={[styles.colunaHeader, { borderBottomColor: coluna.color }]}>
                  <Text style={[styles.colunaLabel, { color: coluna.color }]}>{coluna.label}</Text>
                  <View style={[styles.contador, { backgroundColor: coluna.bg }]}>
                    <Text style={[styles.contadorText, { color: coluna.color }]}>{itens.length}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.colunaBody}>
                  {itens.length === 0 ? (
                    <Text style={styles.vazio}>Nenhum tapete</Text>
                  ) : (
                    itens.map((item, i) => (
                      <KanbanCard
                        key={`${item.orcamento.id}-${i}`}
                        item={item}
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  total: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  erro: {
    color: colors.danger,
    fontSize: 14,
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
  },
  colunaLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  contador: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  contadorText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  colunaBody: {
    padding: 8,
  },
  vazio: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
  rodape: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: 16,
  },
});
