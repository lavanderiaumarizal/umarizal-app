# Plano de Implementação — B6: Endpoint `POST /api/etapas/:orcamentoId/concluir`

> **Sprint:** 1 — Fundação (Backend)
> **Data de Conclusão:** 30/07/2026
> **Responsável:** IA + Usuário (Orquestrador Central — Opção 1 Projeto Completo)
> **Status:** 🔵 Em Homologação *(implementado e validado com testes automatizados em 06/08/2026 — ver `backend/src/__tests__/integration/etapas.test.ts`)*

---

## 0. Contexto: Dois Sistemas de Fases/Etapas (importante)

O sistema atual possui **dois sistemas paralelos** que NÃO se confundem. A B6 é a primeira tarefa que faz a **ponte entre eles**:

### Sistema 1 — Fases do Painel Admin (10 fases, existente)

| Característica | Detalhe |
|----------------|---------|
| **Endpoint** | `GET /api/orcamentos/trilha` (Trilha da Excelência) |
| **Avanço** | `PATCH /api/orcamentos/:id/fase` (FaseStepper) |
| **Service** | `src/services/fases.service.ts` — `avancarFase()` |
| **Tabela** | `historico_fases` + campo `faseAtual` no `orcamentos` |
| **Usado por** | Painel admin web (`/admin/trilha/`, `/admin/orcamentos/detalhes/`) |
| **Fases** | 10: `F0_ABORDAGEM` → `F0_ORCAMENTO` → `F0_APROVACAO` → `F1_AGENDADO` → `F1_COLETADO` → `F1_DOCUMENTACAO` → `F2_F3_PRODUCAO` → `SECAGEM` → `F4_DEVOLUCAO` → `ENTREGUE` |
| **Granularidade** | Grossa — `F2_F3_PRODUCAO` engloba lavagem+secagem inteiros |
| **Transições** | Validadas por `TRANSICOES_VALIDAS` em `fases.service.ts` (ex: `F1_DOCUMENTACAO → [F2_F3_PRODUCAO, F1_COLETADO]`) |

### Sistema 2 — Etapas do App (12 etapas, NOVO — B5 em diante)

| Característica | Detalhe |
|----------------|---------|
| **Endpoint** | `POST /api/etapas/:orcamentoId/iniciar` (B5 ✅) |
| **Avanço** | `POST /api/etapas/:orcamentoId/concluir` (**B6 — este documento**) |
| **Tabela** | `etapas_producao` (criada na B1) |
| **Usado por** | App mobile (futuro) — motoristas, lavagem, secagem, expedição |
| **Etapas** | 12: `Coleta` → `Documentação` → ... → `Devolução` |
| **Granularidade** | Fina — cada etapa individual (lavagem, higienização, centrifugação separados) |
| **Status** | `pendente` → `em_andamento` → `concluida` |

### Coexistência e a ponte da B6

```
Painel Admin (10 fases)             App Mobile (12 etapas)
       │                                     │
       ▼                                     ▼
PATCH /api/orcamentos/:id/fase      POST /api/etapas/:id/concluir  ← B6
       │                                     │
       ▼                                     ▼
historico_fases                       etapas_producao
       │                                     │
       └─────────── Sincronização ───────────┘
        (B6: concluir certas etapas → avancarFase() no fases.service)
```

**A B5 (iniciar etapa) não mexe no sistema de fases.** A B6 é quem sincroniza: ao concluir determinadas etapas, o orçamento avança para a fase correspondente no sistema existente (via `avancarFase()` do `fases.service.ts`).

---

## 1. Objetivo

Criar o endpoint `POST /api/etapas/:orcamentoId/concluir` que:
1. Marca a etapa como `concluida` (com `concluidoEm`, `responsavel` e `observacoes` opcionais)
2. Registra evento de produção (`tipo: "FIM_PRODUCAO"`) no histórico
3. **Sincroniza o sistema de fases**: concluir etapas-chave avança `faseAtual` do orçamento (ex: etapa 4 → `F2_F3_PRODUCAO`, etapa 12 → `ENTREGUE`)
4. Aplica **progressão forçada**: só conclui a etapa N se a etapa N-1 já estiver concluída
5. Respeita o **controle de perfil** por etapa (mesmo mapeamento da B5)

---

## 2. Auditoria Pré-Implementação (30/07/2026)

Antes de implementar a B6, foi realizada uma auditoria no backend para verificar o que já existe (fruto da B5 e das tarefas anteriores).

### Resultado: a fundação existe — B6 estende o código da B5

| Item | Existe? | Detalhes |
|------|---------|----------|
| Tabela `etapas_producao` (B1) | ✅ | Pronta — model `EtapaProducao` em `schema.prisma` |
| `ETAPAS_NOMES` (12 nomes) | ✅ | `src/services/etapas.service.ts:14` |
| `ETAPA_PERFIL` (etapa → perfil) | ✅ | `src/services/etapas.service.ts:32` |
| `validarPerfilEtapa()` | ✅ | `src/services/etapas.service.ts:50` — admin sempre passa |
| `iniciarEtapa()` (B5) | ✅ | `src/services/etapas.service.ts:63` |
| `listarEtapas()` (B5) | ✅ | `src/services/etapas.service.ts:142` — GET já registrado |
| Rota `POST /:orcamentoId/iniciar` | ✅ | `src/routes/etapas.routes.ts:18` |
| Função `concluirEtapa()` | ❌ **Não** | Precisa criar no service |
| Schema `concluirEtapaSchema` | ❌ **Não** | Precisa criar no validator |
| Controller `concluirEtapa` | ❌ **Não** | Precisa criar no controller |
| Rota `POST /:orcamentoId/concluir` | ❌ **Não** | Precisa adicionar na rota |
| `avancarFase()` (sincronização) | ✅ | `src/services/fases.service.ts:113` — **reutilizar** |
| `validarTransicao()` | ✅ | `src/services/fases.service.ts:104` — para transição best-effort |
| `historico_fases` (coluna gerada `duracao_seg`) | ✅ | `schema.prisma` — **não usar `db push`** (lição B1) |

### Padrões existentes que a B6 DEVE seguir

| Padrão | Onde | Como usar na B6 |
|--------|------|----------------|
| **Validação de perfil no controller** | `etapas.controller.ts:20-23` (B5) | `validarPerfilEtapa(etapa, perfisUsuario)` antes de chamar o service |
| **EventoProducao** | `etapas.service.ts:126` (B5 usa `INICIO_PRODUCAO`) | Concluir usa `tipo: "FIM_PRODUCAO"` (tipo existente no schema: `"COLETA" \| "INICIO_PRODUCAO" \| "FIM_PRODUCAO" \| "DEVOLUCAO" \| "ENTREGA"`) |
| **Sincronização de fases** | `fases.service.ts` — `avancarFase()` | Chamar com a fase-alvo do mapeamento; validar transição antes |
| **Error handling** | `middleware/errorHandler.ts` | `AppError` com código e status HTTP |
| **Resposta padronizada** | `utils/apiResponse.ts` | `sendSuccess` / `sendError` |
| **Validação Zod** | `middleware/validate.ts` | `validate(schema)` na rota |

### O que NÃO existe e NÃO precisa existir

- ❌ **Não** há função de concluir etapa no service — será criada
- ❌ **Não** há endpoint duplicado de conclusão de etapa
- ❌ **Não** há migration necessária — B6 não altera o schema (nenhuma tabela nova)
- ❌ **Não** há necessidade de alterar o `docker-entrypoint.sh`

---

## 3. Validações e Regras de Negócio

### 3.1 Validações do Request

| Validação | Motivo |
|-----------|--------|
| `orcamentoId` deve ser UUID válido | Evita erro 500 no Prisma |
| `etapa` deve ser inteiro entre 1 e 12 | Fora desse range não é etapa válida |
| `responsavel` deve ser string não vazia (2-100 chars) | Obrigatório para auditoria |
| `observacoes` opcional (máx. 500 chars) | Registro de detalhes da conclusão |
| Orçamento deve existir | 404 se não encontrado |

### 3.2 Regras de Progressão (máquina de estados)

A B6 aplica a **progressão forçada** anunciada na B5 (seção 3.2: *"A progressão forçada (só avança se a anterior foi concluída) será aplicada no B6"*):

| Regra | Detalhe |
|-------|---------|
| **Etapa deve estar `em_andamento`** | Concluir exige que a etapa tenha sido iniciada (`POST /iniciar`). Etapa `pendente` → 409 |
| **Etapa já concluída** | 409 — não permite concluir duas vezes |
| **Etapa anterior deve estar `concluida`** | Para concluir etapa N (N > 1), a etapa N-1 precisa estar concluída. Etapa 1 não tem anterior |
| **Flag `FORCAR_PROGRESSAO`** | Constante no service para desligar a progressão forçada se a operação precisar concluir fora de ordem (default: `true`) |

> **Motivação:** diferente do `iniciar` (não-blocking, porque na prática uma etapa começa antes da anterior ser formalmente registrada), o `concluir` representa a **validação formal de um trabalho acabado** — faz sentido exigir ordem.

### 3.3 Controle de Perfil (mesmo mapeamento da B5)

| Etapa | Perfil permitido | Admin? |
|-------|------------------|--------|
| 1 — Coleta | `motorista` | ✅ |
| 2 — Documentação | `expedicao` | ✅ |
| 3 — Aspiração | `expedicao` | ✅ |
| 4 — Lavagem | `lavagem` | ✅ |
| 5 — Higienização | `lavagem` | ✅ |
| 6 — Centrifugação | `lavagem` | ✅ |
| 7 — Estendagem | `secagem` | ✅ |
| 8 — Estufa | `secagem` | ✅ |
| 9 — Escovação | `secagem` | ✅ |
| 10 — Inspeção Final | `expedicao` | ✅ |
| 11 — Embalagem | `expedicao` | ✅ |
| 12 — Devolução | `motorista` | ✅ |

### 3.4 Sincronização com o Sistema de Fases

Quando a etapa concluída é uma **etapa-chave**, o orçamento avança de fase. O mapeamento abaixo segue o **SPRINT1_B1_DETALHAMENTO.md (seção 6)** — padrão: a fase avança quando a **primeira etapa de cada grupo** (F1/F2/F3/F4) é concluída:

| Etapa concluída | Avança `faseAtual` para? | Condição |
|-----------------|--------------------------|----------|
| 1 — Coleta | `F1_COLETADO` | Imediato |
| 2 — Documentação | *(não avança)* | Aguarda etapa 3 |
| 3 — Aspiração | `F1_DOCUMENTACAO` | Etapa 2 já concluída (garantida pela progressão forçada) |
| 4 — Lavagem | `F2_F3_PRODUCAO` | Imediato |
| 5 — Higienização | *(não avança)* | Mesma fase |
| 6 — Centrifugação | *(não avança)* | Mesma fase |
| 7 — Estendagem | `SECAGEM` | Imediato |
| 8 — Estufa | *(não avança)* | Mesma fase |
| 9 — Escovação | *(não avança)* | Mesma fase |
| 10 — Inspeção Final | `F4_DEVOLUCAO` | Imediato |
| 11 — Embalagem | *(não avança)* | Mesma fase |
| 12 — Devolução | `ENTREGUE` | Imediato |

> ⚠️ **Discrepância documental encontrada:** `2_12_ETAPAS.md` (seção "Sincronização com o Sistema de Fases Existente") afirma que a **etapa 9 (Escovação)** avança para `SECAGEM`, enquanto `SPRINT1_B1_DETALHAMENTO.md` (seção 6) afirma que é a **etapa 7 (Estendagem)**.
> **Decisão:** usar o mapeamento da B1 (`etapa 7 → SECAGEM`), pois: (1) é o documento de implementação dedicado; (2) o seed da B16 define `SECAGEM` = etapas 1-6 concluídas (etapa 7 é a primeira da F3); (3) `F2_F3_PRODUCAO → SECAGEM` é a transição válida no `fases.service.ts`. O `2_12_ETAPAS.md` deve ser corrigido em tarefa de documentação futura.

#### Comportamento "best-effort" da sincronização

A sincronização de fase **nunca bloqueia a conclusão da etapa**:

- Se `validarTransicao(orcamento.faseAtual, faseAlvo)` for **válida** → chama `avancarFase()` (fecha histórico anterior, cria registro em `historico_fases`, atualiza `faseAtual` + `status`, invalida cache público e **dispara eventos** — ex: `COLETA_REALIZADA`, `LAVAGEM_INICIADA`, `ENTREGA_REALIZADA`)
- Se a transição for **inválida** (ex: orçamento ainda em `F0_APROVACAO` mas etapa 4 concluída — inconsistência de dados) → a etapa é concluída normalmente, a fase é mantida e um `console.warn` registra o ocorrido

**Motivo:** os dois sistemas podem estar dessincronizados em dados legados. O app não pode falhar por causa do painel admin e vice-versa.

#### Efeitos colaterais automáticos do `avancarFase()`

Ao sincronizar, o `fases.service.ts` já dispara (sem código extra na B6):

| Fase | Evento disparado | Efeito |
|------|------------------|--------|
| `F1_COLETADO` | `COLETA_REALIZADA` | Notificação WhatsApp de coleta |
| `F1_DOCUMENTACAO` | `PRODUCAO_INICIADA` | Produção iniciada |
| `F2_F3_PRODUCAO` | `LAVAGEM_INICIADA` | Lavagem iniciada |
| `SECAGEM` | `SECAGEM_INICIADA` | Secagem iniciada |
| `F4_DEVOLUCAO` | `TAPETE_PRONTO` | Tapete pronto p/ entrega |
| `ENTREGUE` | `ENTREGA_REALIZADA` | Entrega confirmada |

---

## 4. Arquivos que serão criados/alterados

| # | Arquivo | Ação | Impacto |
|---|---------|------|---------|
| 1 | `src/validators/etapas.validator.ts` | **ALTERAR** — Adicionar `concluirEtapaSchema` | 🟢 Baixo |
| 2 | `src/services/etapas.service.ts` | **ALTERAR** — Adicionar `ETAPA_FASE`, `concluirEtapa()` + import de `fases.service` | 🟡 Médio |
| 3 | `src/controllers/etapas.controller.ts` | **ALTERAR** — Adicionar controller `concluirEtapa` | 🟢 Baixo |
| 4 | `src/routes/etapas.routes.ts` | **ALTERAR** — Adicionar rota `POST /:orcamentoId/concluir` | 🟢 Baixo |

**Nenhum arquivo novo.** Nenhuma migration. Nenhuma alteração no schema Prisma.

---

## 5. Código

### 5.1 Validator — `etapas.validator.ts` (adicionar)

```typescript
/**
 * Schema para concluir uma etapa
 * Igual ao iniciar, com observacoes opcionais
 */
export const concluirEtapaSchema = z.object({
  etapa: z
    .number({ message: 'Etapa é obrigatória' })
    .int('Etapa deve ser um número inteiro')
    .min(1, 'Etapa deve ser entre 1 e 12')
    .max(12, 'Etapa deve ser entre 1 e 12'),
  responsavel: z
    .string({ message: 'Responsável é obrigatório' })
    .min(2, 'Responsável deve ter no mínimo 2 caracteres')
    .max(100, 'Responsável muito longo'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});
```

### 5.2 Service — `etapas.service.ts` (adicionar)

```typescript
// NOVO import — sincronização com o sistema de fases
import { avancarFase, validarTransicao } from "./fases.service";

/**
 * Mapeamento etapa concluída → fase a avançar no sistema de fases.
 * Fonte: SPRINT1_B1_DETALHAMENTO.md (seção 6).
 * Padrão: a fase avança quando a PRIMEIRA etapa de cada grupo (F1/F2/F3/F4) é concluída.
 */
export const ETAPA_FASE: Record<number, string> = {
  1: 'F1_COLETADO',
  3: 'F1_DOCUMENTACAO',
  4: 'F2_F3_PRODUCAO',
  7: 'SECAGEM',
  10: 'F4_DEVOLUCAO',
  12: 'ENTREGUE',
};

/**
 * Progressão forçada: só permite concluir a etapa N se a etapa N-1 estiver concluída.
 * Etapa 1 não tem anterior. Desligar aqui caso a operação precise concluir fora de ordem.
 */
const FORCAR_PROGRESSAO = true;

/**
 * Conclui uma etapa (status = concluida) e sincroniza o sistema de fases
 */
export async function concluirEtapa(
  orcamentoId: string,
  etapa: number,
  responsavel: string,
  observacoes?: string,
  usuarioId?: number,
) {
  // 1. Valida orçamento existe
  const orcamento = await prisma.orcamento.findUnique({
    where: { id: orcamentoId },
    select: { id: true, codigo: true, faseAtual: true },
  });

  if (!orcamento) {
    throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
  }

  // 2. Valida etapa existe
  const nomeEtapa = ETAPAS_NOMES[etapa];
  if (!nomeEtapa) {
    throw new AppError(`Etapa ${etapa} não é uma etapa válida (1-12)`, 400, 'ETAPA_INVALIDA');
  }

  // 3. Registro deve existir e estar em andamento
  const existente = await prisma.etapaProducao.findUnique({
    where: { orcamentoId_etapa: { orcamentoId, etapa } },
  });

  if (!existente || existente.status === 'pendente') {
    throw new AppError(
      `Etapa ${etapa} (${nomeEtapa}) não foi iniciada. Use POST /api/etapas/:orcamentoId/iniciar primeiro`,
      409,
      'ETAPA_NAO_INICIADA',
    );
  }

  if (existente.status === 'concluida') {
    throw new AppError(
      `Etapa ${etapa} (${nomeEtapa}) já foi concluída`,
      409,
      'ETAPA_JA_CONCLUIDA',
    );
  }

  // 4. Progressão forçada: etapa anterior precisa estar concluída
  if (FORCAR_PROGRESSAO && etapa > 1) {
    const anterior = await prisma.etapaProducao.findUnique({
      where: { orcamentoId_etapa: { orcamentoId, etapa: etapa - 1 } },
    });

    if (!anterior || anterior.status !== 'concluida') {
      throw new AppError(
        `Etapa ${etapa - 1} (${ETAPAS_NOMES[etapa - 1]}) ainda não foi concluída`,
        409,
        'ETAPA_ANTERIOR_PENDENTE',
      );
    }
  }

  // 5. Conclui a etapa
  const agora = new Date();
  const result = await prisma.etapaProducao.update({
    where: { orcamentoId_etapa: { orcamentoId, etapa } },
    data: {
      status: 'concluida',
      responsavel,
      concluidoEm: agora,
      observacoes: observacoes || null,
    },
  });

  // 6. Registra evento de produção (histórico)
  // Mesmo padrão da B5, com tipo FIM_PRODUCAO (existente no schema)
  await prisma.eventoProducao.create({
    data: {
      orcamentoId,
      tipo: 'FIM_PRODUCAO',
      descricao: `Etapa ${etapa} (${nomeEtapa}) concluída por ${responsavel}${observacoes ? ` — ${observacoes}` : ''}`,
      usuarioId: usuarioId || null,
    },
  });

  // 7. Sincroniza o sistema de fases (best-effort, nunca bloqueia a conclusão)
  // avancarFase(): valida transição, fecha o historico_fases anterior, cria novo
  // registro, atualiza faseAtual + status, invalida cache público e dispara eventos.
  const faseAlvo = ETAPA_FASE[etapa];
  let faseSincronizada = false;
  let faseAtual = orcamento.faseAtual;

  if (faseAlvo && validarTransicao(orcamento.faseAtual, faseAlvo)) {
    await avancarFase(orcamentoId, faseAlvo, usuarioId, { observacoes });
    faseSincronizada = true;
    faseAtual = faseAlvo;
  } else if (faseAlvo) {
    console.warn(
      `[B6] Etapa ${etapa} (${nomeEtapa}) concluída, mas transição ${orcamento.faseAtual} → ${faseAlvo} inválida. Fase mantida. (orcamento ${orcamento.codigo})`,
    );
  }

  return {
    ...result,
    faseSincronizada,
    faseAtual,
  };
}
```

### 5.3 Controller — `etapas.controller.ts` (adicionar)

```typescript
/**
 * POST /api/etapas/:orcamentoId/concluir
 * Conclui uma etapa de produção (status = concluida) + sincroniza fase
 */
export async function concluirEtapa(req: Request, res: Response, next: NextFunction) {
  try {
    const orcamentoId = String(req.params['orcamentoId']);
    const { etapa, responsavel, observacoes } = req.body;
    const usuarioId = (req as any).user?.id as number | undefined;
    const perfisUsuario: string[] = (req as any).user?.perfis || [];

    // Valida perfil do usuário para esta etapa (mesmo padrão do iniciar)
    if (!etapasService.validarPerfilEtapa(etapa, perfisUsuario)) {
      return sendError(res, 403, 'FORBIDDEN', 'Você não tem permissão para concluir esta etapa');
    }

    const result = await etapasService.concluirEtapa(
      orcamentoId,
      etapa,
      responsavel,
      observacoes,
      usuarioId,
    );
    sendSuccess(res, result, `Etapa ${etapa} concluída com sucesso`);
  } catch (err) {
    next(err);
  }
}
```

### 5.4 Routes — `etapas.routes.ts` (alterar)

Atualizar o cabeçalho e adicionar a rota:

```typescript
/**
 * etapas.routes.ts — Rotas de Etapas de Produção
 *
 * POST  /api/etapas/:orcamentoId/iniciar   → Iniciar etapa (status = em_andamento)
 * POST  /api/etapas/:orcamentoId/concluir  → Concluir etapa (status = concluida) + sincroniza fase
 * GET   /api/etapas/:orcamentoId           → Listar status de todas as 12 etapas
 */

import { Router } from 'express';
import * as etapasController from '../controllers/etapas.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { iniciarEtapaSchema, concluirEtapaSchema } from '../validators/etapas.validator';

const router = Router();

router.use(authenticate);

router.post('/:orcamentoId/iniciar',
  validate(iniciarEtapaSchema),
  etapasController.iniciarEtapa,
);

// NOVO — B6
router.post('/:orcamentoId/concluir',
  validate(concluirEtapaSchema),
  etapasController.concluirEtapa,
);

router.get('/:orcamentoId',
  etapasController.listarEtapas,
);

export default router;
```

> **Nota sobre permissão:** igual à B5 — a validação de perfil por etapa é feita no **controller** via `validarPerfilEtapa()`, pois o perfil permitido varia conforme a `etapa` no body (um middleware de rota não lê o body).

---

## 6. Exemplo de Uso

```bash
# Concluir etapa 4 (Lavagem) de um orçamento — deve avançar fase para F2_F3_PRODUCAO
curl -s -X POST 'https://api.lavanderiaumarizal.com.br/api/etapas/SEU_ORCAMENTO_ID/concluir' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"etapa": 4, "responsavel": "João da Lavagem", "observacoes": "Tapete persa 2.10x2.90 lavado"}' | python3 -m json.tool

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "orcamentoId": "...",
#     "etapa": 4,
#     "nome": "Lavagem",
#     "status": "concluida",
#     "responsavel": "João da Lavagem",
#     "concluidoEm": "2026-07-30T14:30:00.000Z",
#     "observacoes": "Tapete persa 2.10x2.90 lavado",
#     "faseSincronizada": true,
#     "faseAtual": "F2_F3_PRODUCAO"
#   },
#   "message": "Etapa 4 concluída com sucesso"
# }
```

---

## 7. Testes de Validação

| # | Cenário | Como testar | Resultado esperado |
|---|---------|-------------|-------------------|
| T1 | Concluir etapa em andamento | `POST /etapas/:id/concluir { etapa: 4, responsavel: "João" }` | 200 + `status="concluida"` + `concluidoEm` preenchido |
| T2 | Etapa não iniciada | Concluir etapa sem chamar `/iniciar` antes | 409 `ETAPA_NAO_INICIADA` |
| T3 | Etapa já concluída | Repetir T1 duas vezes | 409 `ETAPA_JA_CONCLUIDA` |
| T4 | Etapa anterior pendente | Concluir etapa 5 com etapa 4 `pendente`/`em_andamento` | 409 `ETAPA_ANTERIOR_PENDENTE` |
| T5 | Etapa fora do range | `{ etapa: 0 }` ou `{ etapa: 13 }` | 400 "Etapa deve ser entre 1 e 12" |
| T6 | Orçamento inexistente | `POST /etapas/uuid-invalido/concluir` | 404 "Orçamento não encontrado" |
| T7 | Sem responsável | `{ etapa: 4 }` | 400 validação Zod |
| T8 | Sem autenticação | Request sem token | 401 |
| T9 | Perfil não autorizado | Lavagem tenta concluir etapa 10 (inspeção) | 403 "Sem permissão para concluir esta etapa" |
| T10 | **Sincronização de fase válida** | Orçamento em `F1_DOCUMENTACAO`, concluir etapa 4 | 200 + `faseSincronizada: true` + `faseAtual: "F2_F3_PRODUCAO"` |
| T11 | **Sincronização sem transição válida** | Orçamento em `F0_APROVACAO`, concluir etapa 4 | 200 + etapa `concluida` + `faseSincronizada: false` + `faseAtual: "F0_APROVACAO"` (fase mantida, sem erro) |
| T12 | Concluir etapa 1 (Coleta) | Orçamento em `F1_AGENDADO` | 200 + `faseSincronizada: true` + `faseAtual: "F1_COLETADO"` |
| T13 | Concluir etapa 12 (Devolução) | Orçamento em `F4_DEVOLUCAO` | 200 + `faseAtual: "ENTREGUE"` + evento `ENTREGA_REALIZADA` disparado |
| T14 | Observações opcionais | `{ etapa: 4, responsavel: "João", observacoes: "..." }` | Observações salvas no registro |
| T15 | Evento de produção | Consultar `evento_producao` após concluir | Registro com `tipo: "FIM_PRODUCAO"` e descrição com responsável |

---

## 8. Procedimento de Deploy

```bash
# Passo 1: Desenvolvimento
cd /home/lavanderia/GitHub/backend

# Alterar 4 arquivos (nenhum novo):
# - src/validators/etapas.validator.ts  (concluirEtapaSchema)
# - src/services/etapas.service.ts      (ETAPA_FASE + concluirEtapa)
# - src/controllers/etapas.controller.ts (concluirEtapa)
# - src/routes/etapas.routes.ts         (rota POST /:orcamentoId/concluir)

# Passo 2: Verificar compilação
cd /home/lavanderia/GitHub/backend
npx tsc --noEmit

# Passo 3: Commit e push
cd /home/lavanderia/GitHub/backend
git add -A
git commit -m "feat: endpoint POST /api/etapas/:id/concluir com sincronização de fases"
git push

# Passo 4: Deploy via Dokploy (polling do git detecta o push e reconstrói)
# Deploy manual alternativo:
curl -s -X POST 'http://vmi1352054.contaboserver.net:3000/api/application.deploy' \
  -H 'x-api-key: SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"applicationId": "Th6rDvBVOlkgnvMu_KD4q"}'

# Passo 5: Testar em produção
curl -s -X POST 'https://api.lavanderiaumarizal.com.br/api/etapas/SEU_ORCAMENTO_ID/concluir' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"etapa": 4, "responsavel": "João"}' | python3 -m json.tool

# Passo 6: Verificar sincronização no painel admin
# GET /api/orcamentos/trilha → orçamento deve aparecer em F2_F3_PRODUCAO
```

> **Nenhuma migration necessária** — B6 não altera o schema. O `docker-entrypoint.sh` roda `prisma generate` + `migrate deploy` automaticamente no deploy (nada pendente).

---

## 9. Riscos e Atenção

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Discrepância de mapeamento (etapa 7 vs 9 → SECAGEM)** 🟡 | Fase avança no momento errado | Usar B1 (`etapa 7`), corrigir `2_12_ETAPAS.md` em tarefa de documentação |
| **Transição de fase inválida** 🟡 | `avancarFase()` lançaria erro | Sincronização best-effort: validar com `validarTransicao()` antes; etapa conclui mesmo assim |
| **Progressão forçada bloqueia fluxo real** 🟡 | Equipe conclui etapa sem a anterior registrada | Flag `FORCAR_PROGRESSAO` no service (default `true`); desligar se a operação pedir |
| **Concorrência** 🟡 | Dois usuários concluem a mesma etapa ao mesmo tempo | Unique `@@unique([orcamentoId, etapa])` + leitura/atualização atômica do status |
| **Coluna gerada `duracao_seg`** 🟢 | `db push` falha em `historico_fases` | Não usar `db push` (lição B1); B6 não altera schema — só chama `avancarFase()` |
| **Eventos WhatsApp duplicados** 🟡 | `avancarFase()` dispara eventos que já foram disparados manualmente no painel | Se a fase já estiver adiantada, `validarTransicao` retorna `false` e nada é disparado |
| **Orçamento deletado** 🟢 | `onDelete: Cascade` na FK | Etapas e eventos são deletados automaticamente — sem órfãos |

---

## 10. Próximos passos

Após a B6, as próximas tarefas seguem a mesma estrutura:

- **B7**: `POST /api/etapas/:orcamentoId/retornar` — retorna etapa para `pendente`, registra `motivo` em `observacoes` + evento (`tipo` a definir, ex: `RETORNO_PRODUCAO` — adicionar ao schema se necessário)
- **B8**: `GET /api/etapas/:orcamentoId` — **já implementado na B5** (`listarEtapas`); validar se atende ao contrato e fechar a tarefa
- **B9**: `POST /api/orcamentos/:id/coleta-realizada` — coleta com fotos + assinatura (usa o padrão de conclusão da etapa 1)
- **B10**: `POST /api/orcamentos/:id/entrega-realizada` — entrega com assinatura (conclui etapa 12)
- **B11/B12**: `POST/DELETE /api/orcamentos/:id/carregar` — flag de carregamento (`carregamento_veiculo`)
- **B13/B14**: `GET /api/orcamentos/minhas-coletas` e `minhas-entregas` — escopo por `transportadorId`
- **B16**: Seed das 12 etapas para orçamentos existentes (usar mapeamento da seção 7 da B1)

---

## 🔗 Referências

- [[SPRINT1_B5_DETALHAMENTO.md]] — estrutura base, `ETAPAS_NOMES`, `ETAPA_PERFIL`, `validarPerfilEtapa()`
- [[SPRINT1_B1_DETALHAMENTO.md]] — criação da tabela `etapas_producao` + mapeamento etapa → fase (seção 6) + seed (seção 7)
- [[2_12_ETAPAS.md]] — mapeamento fase → etapas (⚠️ corrigir discrepância da etapa 9)
- [[1_ARQUITETURA.md]] — coexistência dos dois sistemas de fases/etapas (seção 1.4)
- [[TAREFAS.md]] — B6 na Sprint 1
- `backend/src/services/fases.service.ts` — `avancarFase()`, `validarTransicao()`, `TRANSICOES_VALIDAS`
- `backend/src/services/etapas.service.ts` — código B5 existente
