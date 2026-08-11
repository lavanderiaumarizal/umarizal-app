/**
 * screens/Producao.tsx — Produção: Lavagem (F20/F21) e Secagem (F22/F23)
 *
 * - Fila (etapa do grupo pendente) → "▶ Iniciar"
 * - Em andamento (etapa do grupo em_andamento) → "✓ Concluir"
 * - Modal com observações (F24) + foto opcional via câmera (F25)
 * - Dados do kanban por perfil (B18); ações via B5/B6
 *
 * Grupos de etapas:
 *   lavagem → [4, 5, 6] · secagem → [7, 8, 9]
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
  Modal,
  TextInput,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { colors, primaryGradient } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { kanbanPorPerfil, ETAPA_NOME, type KanbanItem } from '../api/kanban';
import { iniciarEtapa, concluirEtapa } from '../api/etapas';
import CameraCapture from '../components/CameraCapture';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import type { Perfil } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

const GRUPOS: Record<string, number[]> = {
  lavagem: [4, 5, 6],
  secagem: [7, 8, 9],
};

const LABEL: Record<string, { fila: string; agora: string; verbo: string; icone: string }> = {
  lavagem: { fila: '🧼 Na Fila de Lavagem', agora: '🫧 Lavando Agora', verbo: 'lavagem', icone: '🧼' },
  secagem: { fila: '☀️ Na Fila de Secagem', agora: '🌬️ Secando Agora', verbo: 'secagem', icone: '☀️' },
};

type Acao =
  | { tipo: 'iniciar'; item: KanbanItem }
  | { tipo: 'concluir'; item: KanbanItem }
  | null;

export default function ProducaoScreen({ route }: { route: RouteProp<RootStackParamList, 'Producao'> }) {
  const { perfil } = route.params;
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const responsavel = user?.nome ?? 'Produção';

  const grupo = GRUPOS[perfil] ?? [4, 5, 6];
  const meta = LABEL[perfil] ?? LABEL.lavagem;

  const [dados, setDados] = useState<{ pendente: KanbanItem[]; em_andamento: KanbanItem[] }>({
    pendente: [],
    em_andamento: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [acao, setAcao] = useState<Acao>(null);
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await kanbanPorPerfil(perfil);
      setDados({
        pendente: res.data.colunas.pendente,
        em_andamento: res.data.colunas.em_andamento,
      });
    } catch {
      setErro('Não foi possível carregar a fila. Verifique sua conexão.');
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

  function abrirAcao(tipo: 'iniciar' | 'concluir', item: KanbanItem) {
    setObservacoes('');
    setFoto(null);
    setAcao({ tipo, item });
  }

  async function confirmar() {
    if (!acao) return;
    setEnviando(true);
    try {
      const etapa = acao.item.etapaAtual ?? grupo[0];
      if (acao.tipo === 'iniciar') {
        await iniciarEtapa(acao.item.orcamento.id, etapa, responsavel);
      } else {
        await concluirEtapa(acao.item.orcamento.id, etapa, responsavel, observacoes || undefined);
      }
      setAcao(null);
      await carregar();
    } catch {
      setErro('Não foi possível executar a ação.');
    } finally {
      setEnviando(false);
    }
  }

  function renderItem(item: KanbanItem, tipo: 'iniciar' | 'concluir') {
    const etapa = item.etapaAtual ?? grupo[0];
    return (
      <View key={item.orcamento.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.codigo}>{item.orcamento.codigo}</Text>
          <StatusBadge status={item.etapaStatus} />
        </View>
        <Text style={styles.cliente} numberOfLines={1}>{item.orcamento.cliente.nome}</Text>
        <Text style={styles.etapaInfo}>
          Etapa: {ETAPA_NOME[etapa] ?? etapa}
        </Text>
        <TouchableOpacity
          style={[styles.botaoAcao, tipo === 'iniciar' ? styles.botaoIniciar : styles.botaoConcluir]}
          onPress={() => abrirAcao(tipo, item)}
        >
          <Text style={styles.botaoAcaoText}>
            {tipo === 'iniciar' ? `▶ Iniciar ${meta.verbo}` : `✓ Concluir ${meta.verbo}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : erro ? (
        <View style={styles.center}>
          <Text style={styles.erro}>{erro}</Text>
          <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar()}>
            <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Fila (pendente) */}
          <Text style={styles.secao}>{meta.fila} ({dados.pendente.length})</Text>
          {dados.pendente.length === 0 ? (
            <Text style={styles.vazio}>Nenhum tapete na fila.</Text>
          ) : (
            dados.pendente.map((item) => renderItem(item, 'iniciar'))
          )}

          {/* Em andamento */}
          <Text style={[styles.secao, styles.secaoTop]}>
            {meta.agora} ({dados.em_andamento.length})
          </Text>
          {dados.em_andamento.length === 0 ? (
            <Text style={styles.vazio}>Nada em andamento agora.</Text>
          ) : (
            dados.em_andamento.map((item) => renderItem(item, 'concluir'))
          )}
        </ScrollView>
      )}

      {/* Modal de ação: observações (F24) + foto (F25) */}
      <Modal visible={!!acao} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {acao?.tipo === 'iniciar' ? `▶ Iniciar ${meta.verbo}` : `✓ Concluir ${meta.verbo}`}
            </Text>
            <Text style={styles.modalStop}>
              {acao?.item.orcamento.codigo} · {acao?.item.orcamento.cliente.nome}
            </Text>
            <Text style={styles.modalEtapa}>
              {acao?.item.etapaAtual != null ? ETAPA_NOME[acao.item.etapaAtual] : ''}
            </Text>

            <TextInput
              style={styles.obsInput}
              placeholder={`Observações (opcional) — ex: mancha persistente`}
              placeholderTextColor={colors.textMuted}
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />

            <View style={styles.fotoRow}>
              {foto ? (
                <View style={styles.fotoTaken}>
                  <Text style={styles.fotoTakenText}>📷 Foto ✓</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.botaoCamera} onPress={() => setMostrarCamera(true)}>
                <Text style={styles.botaoCameraText}>📷 Foto de produção</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setAcao(null)} disabled={enviando}>
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoConfirmar, enviando && styles.botaoDisabled]}
                onPress={() => void confirmar()}
                disabled={enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoConfirmarText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Câmera */}
      <Modal visible={mostrarCamera} animationType="slide" onRequestClose={() => setMostrarCamera(false)}>
        <CameraCapture
          onCapture={(base64) => {
            setFoto(base64);
            setMostrarCamera(false);
          }}
          onClose={() => setMostrarCamera(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  botaoPrimario: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 14, paddingBottom: 32 },
  secao: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  secaoTop: { marginTop: 20 },
  vazio: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  codigo: { color: colors.active, fontSize: 12, fontWeight: 'bold' },
  cliente: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  etapaInfo: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  botaoAcao: { borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  botaoIniciar: { backgroundColor: colors.primary },
  botaoConcluir: { backgroundColor: colors.success },
  botaoAcaoText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  modalStop: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  modalEtapa: { color: colors.active, fontSize: 13, fontWeight: 'bold', marginTop: 4, marginBottom: 8 },
  obsInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  fotoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  fotoTaken: { backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  fotoTakenText: { color: colors.success, fontWeight: 'bold', fontSize: 12 },
  botaoCamera: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botaoCameraText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 14 },
  botaoCancelar: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoCancelarText: { color: colors.textSecondary, fontWeight: 'bold' },
  botaoConfirmar: {
    flex: 2,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoConfirmarText: { color: '#fff', fontWeight: 'bold' },
  botaoDisabled: { opacity: 0.5 },
});
