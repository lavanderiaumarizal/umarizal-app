/**
 * screens/DocumentacaoOrcamento.tsx — Captura por Item (F32–F35)
 *
 * - Lista os itens (tapetes) do orçamento com medidas
 * - Cada item: botão [+] abre a câmera → upload vinculado ao itemId (F33)
 * - Miniaturas das fotos por item com ✕ para remover (F34)
 * - "Documentação Concluída" avança a etapa 2 (F35 → B5/B6)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { colors, primaryGradient } from '../theme';
import { getOrcamento, getFotos, uploadFotos, deleteFoto, type Foto, type OrcamentoDocumentacao } from '../api/orcamentos';
import { getEtapas, iniciarEtapa, concluirEtapa } from '../api/etapas';
import CameraCapture from '../components/CameraCapture';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function DocumentacaoOrcamentoScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'DocumentacaoOrcamento'>;
}) {
  const { orcamentoId } = route.params;
  const user = useAuthStore((s) => s.user);
  const responsavel = user?.nome ?? 'Expedição';

  const [orcamento, setOrcamento] = useState<OrcamentoDocumentacao | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [etapa2, setEtapa2] = useState<string>('pendente');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [itemFoto, setItemFoto] = useState<string | null>(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [o, f, e] = await Promise.all([
        getOrcamento(orcamentoId),
        getFotos(orcamentoId),
        getEtapas(orcamentoId),
      ]);
      setOrcamento(o as OrcamentoDocumentacao);
      setFotos(f);
      setEtapa2(e.etapa_2?.status ?? 'pendente');
    } catch {
      setErro('Não foi possível carregar o orçamento.');
    } finally {
      setLoading(false);
    }
  }, [orcamentoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** F33 — Foto tirada → upload vinculado ao item */
  async function handleFoto(base64: string) {
    if (!itemFoto) return;
    setEnviando(true);
    try {
      await uploadFotos(orcamentoId, [base64], itemFoto);
      setItemFoto(null);
      await carregar();
    } catch {
      setErro('Não foi possível enviar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  /** F34 — Remover foto */
  async function removerFoto(foto: Foto) {
    setEnviando(true);
    try {
      await deleteFoto(orcamentoId, foto.id);
      await carregar();
    } catch {
      setErro('Não foi possível remover a foto.');
    } finally {
      setEnviando(false);
    }
  }

  /** F35 — Confirmar documentação (avança etapa 2) */
  async function confirmarDocumentacao() {
    setEnviando(true);
    try {
      if (etapa2 === 'pendente') {
        await iniciarEtapa(orcamentoId, 2, responsavel);
      }
      await concluirEtapa(orcamentoId, 2, responsavel);
      await carregar();
    } catch {
      setErro('Não foi possível concluir a documentação.');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro && !orcamento) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
        <TouchableOpacity style={styles.botaoPrimario} onPress={() => void carregar()}>
          <Text style={styles.botaoPrimarioText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fotosPorItem = (itemId: string) => fotos.filter((f) => f.itemId === itemId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.codigo}>{orcamento?.codigo}</Text>
      <Text style={styles.cliente} numberOfLines={1}>{orcamento?.cliente.nome}</Text>

      <Text style={styles.secao}>📷 Fotografe o estado inicial de cada item</Text>

      {(orcamento?.itens ?? []).map((item) => {
        const fotosItem = fotosPorItem(item.id);
        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.itemNome}>{item.servicoNome ?? 'Serviço'}</Text>
            <Text style={styles.itemMedidas}>
              {item.largura && item.comprimento
                ? `${item.largura} × ${item.comprimento} m${item.quantidade > 1 ? ` · ×${item.quantidade}` : ''}`
                : item.categoriaNome ?? ''}
            </Text>

            {/* Miniaturas das fotos do item */}
            <View style={styles.fotoRow}>
              {fotosItem.map((foto) => (
                <View key={foto.id} style={styles.thumbWrap}>
                  <Image source={{ uri: foto.thumb }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.remover}
                    onPress={() => void removerFoto(foto)}
                    disabled={enviando}
                  >
                    <Text style={styles.removerText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addFoto, enviando && styles.botaoDisabled]}
                onPress={() => {
                  setItemFoto(item.id);
                  setMostrarCamera(true);
                }}
                disabled={enviando}
              >
                <Text style={styles.addFotoText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fotoContador}>{fotosItem.length} foto(s)</Text>
          </View>
        );
      })}

      {/* Confirmar documentação */}
      <TouchableOpacity
        style={[styles.confirmar, enviando && styles.botaoDisabled]}
        onPress={() => void confirmarDocumentacao()}
        disabled={enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmarText}>
            {etapa2 === 'concluida' ? '✅ Documentação já concluída' : '✅ Confirmar Documentação'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Câmera */}
      <Modal visible={mostrarCamera} animationType="slide" onRequestClose={() => setMostrarCamera(false)}>
        <CameraCapture
          onCapture={(base64) => {
            setMostrarCamera(false);
            void handleFoto(base64);
          }}
          onClose={() => setMostrarCamera(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  botaoPrimario: { backgroundColor: primaryGradient[1], borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botaoPrimarioText: { color: '#fff', fontWeight: 'bold' },
  codigo: { color: colors.active, fontSize: 16, fontWeight: 'bold' },
  cliente: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  secao: { color: colors.textSecondary, fontSize: 13, marginTop: 16, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  itemNome: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  itemMedidas: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  fotoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumbWrap: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.background },
  thumb: { width: 72, height: 72 },
  remover: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removerText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  addFoto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFotoText: { color: colors.primary, fontSize: 28, fontWeight: 'bold' },
  fotoContador: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  confirmar: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  botaoDisabled: { opacity: 0.6 },
});
