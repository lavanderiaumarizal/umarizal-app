/**
 * screens/DetalhesOrcamento.tsx — Detalhes do Tapete (F10)
 *
 * - Fotos do estado inicial (GET /orcamentos/:id/fotos)
 * - Dados do cliente (endereço conforme perfil — doc 6)
 * - Itens/medidas
 * - Timeline das 12 etapas (F11)
 * - Ações por etapa: Iniciar (B5) / Concluir (B6) / Retornar (B7)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { colors, primaryGradient } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrcamento, getFotos, type Foto } from '../api/orcamentos';
import { getEtapas, iniciarEtapa, concluirEtapa, retornarEtapa, type EtapasResponse } from '../api/etapas';
import EtapaTimeline from '../components/EtapaTimeline';
import StatusBadge from '../components/StatusBadge';
import InspecaoChecklist from '../components/InspecaoChecklist';
import CameraCapture from '../components/CameraCapture';
import { useAuthStore } from '../store/authStore';
import type { Perfil } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

/** Etapas que cada perfil pode operar (espelho do ETAPA_PERFIL do backend) */
const ETAPA_PERFIL: Record<number, Perfil[]> = {
  1: ['motorista'],
  2: ['expedicao'],
  3: ['expedicao'],
  4: ['lavagem'],
  5: ['lavagem'],
  6: ['lavagem'],
  7: ['secagem'],
  8: ['secagem'],
  9: ['secagem'],
  10: ['expedicao'],
  11: ['expedicao'],
  12: ['motorista'],
};

/** Perfis que visualizam o endereço completo (doc 6) */
const VE_ENDERECO: Perfil[] = ['admin', 'motorista', 'expedicao'];

export default function DetalhesOrcamentoScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'Detalhes'>;
}) {
  const { orcamentoId } = route.params;
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const perfis = user?.perfis ?? [];
  const responsavel = user?.nome ?? 'App';

  const [orcamento, setOrcamento] = useState<any>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [etapas, setEtapas] = useState<EtapasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  // Modal de retorno
  const [retornandoEtapa, setRetornandoEtapa] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [acoesLoading, setAcoesLoading] = useState<number | null>(null);

  // F28 — Inspeção Final (etapa 10)
  const [mostrarInspecao, setMostrarInspecao] = useState(false);
  const [obsInspecao, setObsInspecao] = useState('');

  // F29 — Embalagem (etapa 11) com foto opcional
  const [mostrarEmbalagem, setMostrarEmbalagem] = useState(false);
  const [obsEmbalagem, setObsEmbalagem] = useState('');
  const [fotoEmbalagem, setFotoEmbalagem] = useState<string | null>(null);
  const [mostrarCameraEmbalagem, setMostrarCameraEmbalagem] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [o, f, e] = await Promise.all([
        getOrcamento(orcamentoId),
        getFotos(orcamentoId),
        getEtapas(orcamentoId),
      ]);
      setOrcamento(o);
      setFotos(f);
      setEtapas(e);
    } catch {
      setErro('Não foi possível carregar os detalhes. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [orcamentoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** Etapas que o usuário pode operar */
  const etapasOperaveis = (perfis.includes('admin') ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : perfis.flatMap((p) => Object.entries(ETAPA_PERFIL).filter(([, ps]) => ps.includes(p)).map(([n]) => Number(n))));

  /** Etapa atual do usuário = primeira etapa operável ainda não concluída */
  function etapaAtual(): { numero: number; status: string } | null {
    if (!etapas) return null;
    for (const n of etapasOperaveis) {
      const e = etapas[`etapa_${n}` as keyof EtapasResponse];
      if (e && e.status !== 'concluida') return { numero: n, status: e.status };
    }
    return null;
  }

  const atual = etapaAtual();

  async function handleIniciar(etapa: number) {
    setAcoesLoading(etapa);
    try {
      await iniciarEtapa(orcamentoId, etapa, responsavel);
      await carregar();
    } catch {
      setErro('Não foi possível iniciar a etapa.');
    } finally {
      setAcoesLoading(null);
    }
  }

  async function handleConcluir(etapa: number) {
    setAcoesLoading(etapa);
    try {
      await concluirEtapa(orcamentoId, etapa, responsavel);
      await carregar();
    } catch {
      setErro('Não foi possível concluir a etapa.');
    } finally {
      setAcoesLoading(null);
    }
  }

  async function handleRetornar() {
    if (retornandoEtapa === null || !motivo.trim()) return;
    setAcoesLoading(retornandoEtapa);
    try {
      await retornarEtapa(orcamentoId, retornandoEtapa, motivo.trim());
      setRetornandoEtapa(null);
      setMotivo('');
      await carregar();
    } catch {
      setErro('Não foi possível retornar a etapa.');
    } finally {
      setAcoesLoading(null);
    }
  }

  /** F29 — Conclui a embalagem (etapa 11) com foto opcional */
  async function handleConfirmarEmbalagem() {
    setAcoesLoading(11);
    try {
      const obs = obsEmbalagem.trim() ? obsEmbalagem.trim() : undefined;
      await concluirEtapa(orcamentoId, 11, responsavel, obs);
      setMostrarEmbalagem(false);
      setObsEmbalagem('');
      setFotoEmbalagem(null);
      await carregar();
    } catch {
      setErro('Não foi possível concluir a embalagem.');
    } finally {
      setAcoesLoading(null);
    }
  }

  /** F28 — Confirma inspeção (todos OK) e conclui a etapa 10 */
  async function handleConfirmarInspecao(resultados: Record<string, boolean>, observacoes?: string) {
    setAcoesLoading(10);
    try {
      const detalhes = Object.entries(resultados)
        .map(([k, v]) => `${k}: ${v ? 'OK' : 'NOK'}`)
        .join(', ');
      const obs = [observacoes ?? '', `Inspeção: ${detalhes}`].filter(Boolean).join(' · ');
      await concluirEtapa(orcamentoId, 10, responsavel, obs);
      setMostrarInspecao(false);
      setObsInspecao('');
      await carregar();
    } catch {
      setErro('Não foi possível concluir a inspeção.');
    } finally {
      setAcoesLoading(null);
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
        <TouchableOpacity style={styles.retry} onPress={() => void carregar()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const veEndereco = perfis.some((p) => VE_ENDERECO.includes(p));

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.codigo}>{orcamento.codigo}</Text>
          <Text style={styles.fase}>{orcamento.faseAtual?.replace(/_/g, ' ') ?? ''}</Text>
        </View>
        <StatusBadge status={orcamento.status?.toLowerCase() ?? ''} />
      </View>

      {/* Fotos do estado inicial */}
      <Text style={styles.sectionTitle}>📷 Fotos do estado inicial</Text>
      {fotos.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma foto registrada.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotoRow}>
          {fotos.map((foto) => (
            <TouchableOpacity key={foto.id} onPress={() => setFotoAmpliada(foto.original)}>
              <Image source={{ uri: foto.thumb }} style={styles.foto} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Cliente */}
      <Text style={styles.sectionTitle}>👤 Cliente</Text>
      <View style={styles.card}>
        <Text style={styles.clienteNome}>{orcamento.cliente?.nome}</Text>
        <Text style={styles.clienteMeta}>{orcamento.cliente?.telefone}</Text>
        {veEndereco && orcamento.cliente?.endereco ? (
          <Text style={styles.clienteMeta}>
            {orcamento.cliente.endereco}
            {orcamento.cliente.numero ? `, ${orcamento.cliente.numero}` : ''}
            {orcamento.cliente.bairro ? ` · ${orcamento.cliente.bairro}` : ''}
          </Text>
        ) : null}
      </View>

      {/* Itens */}
      <Text style={styles.sectionTitle}>🧺 Itens</Text>
      <View style={styles.card}>
        {(orcamento.itens ?? []).length === 0 ? (
          <Text style={styles.vazio}>Sem itens.</Text>
        ) : (
          orcamento.itens.map((item: any, i: number) => (
            <View key={item.id ?? i} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNome}>{item.servicoNome ?? 'Serviço'}</Text>
                <Text style={styles.itemCategoria}>{item.categoriaNome}</Text>
              </View>
              {item.largura && item.comprimento ? (
                <Text style={styles.itemMedidas}>
                  {item.largura} × {item.comprimento} m
                  {item.quantidade > 1 ? ` · ×${item.quantidade}` : ''}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Timeline das 12 etapas */}
      <Text style={styles.sectionTitle}>🔄 Timeline (12 etapas)</Text>
      <View style={styles.card}>
        {etapas ? <EtapaTimeline etapas={etapas} /> : <Text style={styles.vazio}>Sem dados de etapas.</Text>}
      </View>

      {/* Ações por etapa */}
      {atual && (
        <View style={styles.acoes}>
          <Text style={styles.acoesTitle}>
            Etapa atual: {etapas?.[`etapa_${atual.numero}` as keyof EtapasResponse]?.nome}
          </Text>
          {atual.status === 'pendente' && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoPrimario]}
              onPress={() => void handleIniciar(atual.numero)}
              disabled={acoesLoading !== null}
            >
              {acoesLoading === atual.numero ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoText}>▶ Iniciar etapa</Text>
              )}
            </TouchableOpacity>
          )}
          {atual.status === 'em_andamento' && atual.numero === 10 && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoSucesso]}
              onPress={() => setMostrarInspecao(true)}
              disabled={acoesLoading !== null}
            >
              <Text style={styles.botaoText}>🔍 Concluir Inspeção Final</Text>
            </TouchableOpacity>
          )}
          {atual.status === 'em_andamento' && atual.numero === 11 && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoEmbalagem]}
              onPress={() => setMostrarEmbalagem(true)}
              disabled={acoesLoading !== null}
            >
              <Text style={styles.botaoText}>📦 Embalar tapete</Text>
            </TouchableOpacity>
          )}
          {atual.status === 'em_andamento' && atual.numero !== 10 && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoSucesso]}
              onPress={() => void handleConcluir(atual.numero)}
              disabled={acoesLoading !== null}
            >
              {acoesLoading === atual.numero ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoText}>✓ Concluir etapa</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.botao, styles.botaoRetornar]}
            onPress={() => setRetornandoEtapa(atual.numero)}
            disabled={acoesLoading !== null}
          >
            <Text style={styles.botaoRetornarText}>↩ Retornar etapa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal: foto ampliada */}
      <Modal visible={!!fotoAmpliada} transparent animationType="fade" onRequestClose={() => setFotoAmpliada(null)}>
        <TouchableOpacity style={styles.modalFoto} onPress={() => setFotoAmpliada(null)}>
          <Image source={{ uri: fotoAmpliada ?? undefined }} style={styles.fotoAmpliada} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      {/* Modal: F29 — Embalagem (etapa 11) */}
      <Modal visible={mostrarEmbalagem} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📦 Embalar tapete</Text>
            <Text style={styles.modalSub}>Conclui a etapa 11 (Embalagem)</Text>

            <View style={styles.embalagemFotoRow}>
              {fotoEmbalagem ? (
                <View style={styles.embalagemFotoTaken}>
                  <Text style={styles.embalagemFotoTakenText}>📷 Foto ✓</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.botaoCamera}
                onPress={() => setMostrarCameraEmbalagem(true)}
                disabled={acoesLoading !== null}
              >
                <Text style={styles.botaoCameraText}>📷 Foto do tapete embalado</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Observações (opcional)"
              placeholderTextColor={colors.textMuted}
              value={obsEmbalagem}
              onChangeText={setObsEmbalagem}
              multiline
              editable={acoesLoading === null}
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.botao, styles.botaoCancelar]}
                onPress={() => {
                  setMostrarEmbalagem(false);
                  setObsEmbalagem('');
                  setFotoEmbalagem(null);
                }}
                disabled={acoesLoading !== null}
              >
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botao, styles.botaoSucesso, acoesLoading !== null && styles.botaoDisabled]}
                onPress={() => void handleConfirmarEmbalagem()}
                disabled={acoesLoading !== null}
              >
                {acoesLoading === 11 ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoText}>Confirmar embalagem</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Câmera da embalagem */}
      <Modal
        visible={mostrarCameraEmbalagem}
        animationType="slide"
        onRequestClose={() => setMostrarCameraEmbalagem(false)}
      >
        <CameraCapture
          onCapture={(base64) => {
            setFotoEmbalagem(base64);
            setMostrarCameraEmbalagem(false);
          }}
          onClose={() => setMostrarCameraEmbalagem(false)}
        />
      </Modal>

      {/* Modal: F28 — Inspeção Final (etapa 10) */}
      <Modal visible={mostrarInspecao} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            <InspecaoChecklist
              observacoes={obsInspecao}
              onSetObservacoes={setObsInspecao}
              onConfirm={handleConfirmarInspecao}
              enviando={acoesLoading === 10}
            />
            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelarModal]}
              onPress={() => setMostrarInspecao(false)}
              disabled={acoesLoading !== null}
            >
              <Text style={styles.botaoCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: motivo do retorno */}
      <Modal visible={retornandoEtapa !== null} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Retornar etapa</Text>
            <Text style={styles.modalSub}>
              {retornandoEtapa !== null && etapas
                ? etapas[`etapa_${retornandoEtapa}` as keyof EtapasResponse]?.nome
                : ''}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Motivo do retorno (obrigatório)"
              placeholderTextColor={colors.textMuted}
              value={motivo}
              onChangeText={setMotivo}
              multiline
              editable={acoesLoading === null}
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.botao, styles.botaoCancelar]}
                onPress={() => {
                  setRetornandoEtapa(null);
                  setMotivo('');
                }}
                disabled={acoesLoading !== null}
              >
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botao, styles.botaoSucesso, !motivo.trim() && styles.botaoDisabled]}
                onPress={() => void handleRetornar()}
                disabled={acoesLoading !== null || !motivo.trim()}
              >
                {acoesLoading === retornandoEtapa ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  erro: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retry: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  codigo: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  fase: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  vazio: { color: colors.textMuted, fontSize: 13, paddingVertical: 8 },
  fotoRow: { flexDirection: 'row' },
  foto: { width: 120, height: 90, borderRadius: 8, marginRight: 8, backgroundColor: colors.surfaceAlt },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  clienteNome: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  clienteMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  itemRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNome: { color: colors.text, fontSize: 14, fontWeight: '600' },
  itemCategoria: { color: colors.textMuted, fontSize: 11 },
  itemMedidas: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  acoes: { marginTop: 20, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  acoesTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  botao: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  botaoPrimario: { backgroundColor: primaryGradient[1] },
  botaoSucesso: { backgroundColor: colors.success },
  botaoEmbalagem: { backgroundColor: colors.brandBlueLight },
  botaoRetornar: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  botaoRetornarText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 },
  botaoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  botaoDisabled: { opacity: 0.5 },
  botaoCancelar: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, flex: 1 },
  botaoCancelarText: { color: colors.textSecondary, fontWeight: 'bold' },
  botaoCancelarModal: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  botaoCancelarTextModal: { color: colors.textSecondary, fontWeight: 'bold' },
  modalFoto: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fotoAmpliada: { width: '95%', height: '80%' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  modalSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 12 },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 16 },
  embalagemFotoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  embalagemFotoTaken: { backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  embalagemFotoTakenText: { color: colors.success, fontWeight: 'bold', fontSize: 12 },
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
});
