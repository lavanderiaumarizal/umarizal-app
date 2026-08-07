/**
 * screens/Documentacao.tsx — Documentação de Entrada (F31)
 *
 * Lista de orçamentos em F1_COLETADO aguardando documentação (B21).
 * Toque abre a captura de fotos por item (F32–F35).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, primaryGradient } from '../theme';
import { documentacaoPendente, type OrcamentoDocumentacao } from '../api/orcamentos';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function DocumentacaoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lista, setLista] = useState<OrcamentoDocumentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await documentacaoPendente();
      setLista(res);
    } catch {
      setErro('Não foi possível carregar a documentação pendente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={styles.titulo}>📋 Documentação Pendente</Text>
      <Text style={styles.sub}>Fotografe o estado inicial de cada item (etapa 2)</Text>

      {erro ? (
        <View style={styles.center}>
          <Text style={styles.erro}>{erro}</Text>
          <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar()}>
            <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : lista.length === 0 ? (
        <Text style={styles.vazio}>Nenhum orçamento aguardando documentação. 🎉</Text>
      ) : (
        lista.map((orc) => (
          <TouchableOpacity
            key={orc.id}
            style={styles.card}
            onPress={() => navigation.navigate('DocumentacaoOrcamento', { orcamentoId: orc.id })}
            activeOpacity={0.7}
          >
            <Text style={styles.codigo}>{orc.codigo}</Text>
            <Text style={styles.cliente} numberOfLines={1}>{orc.cliente.nome}</Text>
            <Text style={styles.itens}>
              {orc.itens.length} item(ns) · {orc.itens.map((i) => i.servicoNome ?? 'Serviço').join(' · ')}
            </Text>
            <Text style={styles.toque}>📷 Tocar para fotografar os itens →</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 16 },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  botaoPrimario: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold' },
  vazio: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  codigo: { color: colors.active, fontSize: 12, fontWeight: 'bold' },
  cliente: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  itens: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  toque: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 10 },
});
