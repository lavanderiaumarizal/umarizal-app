# Plano de Implementação — B5: Endpoint `POST /api/etapas/:orcamentoId/iniciar`

## 0. Contexto: Dois Sistemas de Fases/Etapas (importante)

O sistema atual possui **dois sistemas paralelos** que NÃO se confundem:

### Sistema 1 — Fases do Painel Admin (10 fases, existente)

| Característica | Detalhe |
|----------------|---------|
| **Endpoint** | `GET /api/orcamentos/trilha` (Trilha da Excelência) |
| **Avanço** | `PATCH /api/orcamentos/:id/fase` (FaseStepper) |
| **Tabela** | `historico_fases` + campo `faseAtual` no `orcamentos` |
| **Usado por** | Painel admin web (`/admin/trilha/`, `/admin/orcamentos/detalhes/`) |
| **Fases** | 10: `F0_ABORDAGEM` → `F0_ORCAMENTO` → ... → `ENTREGUE` |
| **Granularidade** | Grossa — F2_F3_PRODUCAO engloba lavagem+secagem inteiros |

### Sistema 2 — Etapas do App (12 etapas, NOVO — B5 em diante)

| Característica | Detalhe |
|----------------|---------|
| **Endpoint** | `POST /api/etapas/:orcamentoId/iniciar` (B5) |
| **Avanço** | `POST /api/etapas/:orcamentoId/concluir` (B6, futuro) |
| **Tabela** | `etapas_producao` (criada na B1) |
| **Usado por** | App mobile (futuro) — motoristas, lavagem, secagem, expedição |
| **Etapas** | 12: `Coleta` → `Documentação` → ... → `Devolução` |
| **Granularidade** | Fina — cada etapa individual (lavagem, higienização, centrifugação separados) |

### Coexistência

```
Painel Admin (10 fases)             App Mobile (12 etapas)
       │                                     │
       ▼                                     ▼
PATCH /api/orcamentos/:id/fase      POST /api/etapas/:id/iniciar
       │                                     │
       ▼                                     ▼
historico_fases                       etapas_producao
       │                                     │
       └─────────── Sincronização ───────────┘
                   (feita no B6 - concluir)
```

**A B5 também inclui a atualização de 2 páginas do painel admin** para que o usuário já possa criar e visualizar usuários com múltiplos perfis (motorista, expedicao, lavagem, secagem). O backend já está pronto para isso (B3 + B3.1), só falta o frontend.

## 2. Auditoria Pré-Implementação (30/07/2026)

Antes de implementar a B5, foi realizada uma auditoria completa no backend e site para verificar se algo já existia relacionado às 12 etapas de produção.

### Resultado: NADA existe — B5 é o primeiro código

| Item | Existe? | Detalhes |
|------|---------|----------|
| Tabela `etapas_producao` (B1) | ✅ Criada | Pronta para uso |
| Endpoint `/api/etapas/*` | ❌ **Não** | Nenhuma rota, controller ou service de etapas |
| Validator `etapas.validator.ts` | ❌ **Não** | Precisa criar |
| Site/Admin usando etapas | ❌ **Não** | Painel admin usa sistema de 10 fases (`historico_fases`) |
| Self-service "etapa" | ❌ Diferente | `salvarEtapaOrcamento()` no `public.controller.ts` é sobre o fluxo de 5 etapas do orçamento self-service — **não tem relação** com as 12 etapas de produção |

### Padrões existentes que a B5 DEVE seguir

| Padrão | Onde | Como usar na B5 |
|--------|------|----------------|
| **EventoProducao** | `agendamento.controller.ts:136` | Ao iniciar etapa, criar `eventoProducao` com `tipo: "INICIO_PRODUCAO"` e `descricao` com nome da etapa |
| **Route registration** | `routes/index.ts:2-24` | Importar `etapasRoutes` e adicionar `router.use("/etapas", etapasRoutes)` |
| **Middleware perfil** | `middleware/permissions.ts` (B3) | Usar `requirePerfil()` para validar acesso por etapa |
| **Error handling** | `middleware/errorHandler.ts` | Usar `AppError` com código e status HTTP |

### O que NÃO existe e NÃO precisa existir

- ❌ **Não** há código legado de etapas para refatorar
- ❌ **Não** há conflito com o sistema de fases existente (10 fases do painel admin)
- ❌ **Não** há endpoints duplicados
- ❌ **Não** há necessidade de alterar nada no site

---

## 3. Validações e Regras de Negócio

### 3.1 Validações do Request

| Validação | Motivo |
|-----------|--------|
| `orcamentoId` deve ser UUID válido | Evita erro 500 no Prisma |
| `etapa` deve ser inteiro entre 1 e 12 | Fora desse range não é etapa válida |
| `responsavel` deve ser string não vazia | Obrigatório para auditoria |
| Orçamento deve existir | 404 se não encontrado |
| Etapa não pode estar já `em_andamento` | Evita duplicidade de início |

### 3.2 Regras de Progressão

O sistema permite iniciar uma etapa **mesmo que etapas anteriores não estejam concluídas** (não-blocking). A progressão forçada (só avança se a anterior foi concluída) será aplicada no **B6 (concluir)**, não no iniciar.

**Motivação:** Na prática da lavanderia, às vezes uma etapa começa antes da anterior ser formalmente concluída no sistema (ex: lavagem começa enquanto documentação ainda está sendo registrada).

### 3.3 Controle de Perfil

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

---

## 4. Arquivos que serão criados/alterados

| # | Arquivo | Ação | Impacto |
|---|---------|------|---------|
| 1 | `src/routes/etapas.routes.ts` | **CRIAR** — Rotas de gerenciamento de etapas | 🟢 Novo |
| 2 | `src/controllers/etapas.controller.ts` | **CRIAR** — Controller com `iniciarEtapa()` | 🟢 Novo |
| 3 | `src/services/etapas.service.ts` | **CRIAR** — Service com `iniciarEtapa()` + validações | 🟢 Novo |
| 4 | `src/validators/etapas.validator.ts` | **CRIAR** — Schema Zod para `iniciarEtapaSchema` | 🟢 Novo |
| 5 | `src/routes/index.ts` | **ALTERAR** — Adicionar `router.use("/etapas", etapasRoutes)` | 🟢 Baixo |
| 6 | `site/src/pages/admin/usuarios/criar.astro` | **ALTERAR** — Adicionar checkboxes de perfis do app + enviar `perfisApp` | 🟢 Baixo |
| 7 | `site/src/components/admin/UsuariosList.jsx` | **ALTERAR** — Mostrar tags coloridas com perfis, edição multi-checkbox | 🟡 Médio |

---

## 5. Código

### 5.1 Validator — `etapas.validator.ts`

```typescript
// src/validators/etapas.validator.ts
import { z } from 'zod';

export const iniciarEtapaSchema = z.object({
  etapa: z
    .number({ message: 'Etapa é obrigatória' })
    .int('Etapa deve ser um número inteiro')
    .min(1, 'Etapa deve ser entre 1 e 12')
    .max(12, 'Etapa deve ser entre 1 e 12'),
  responsavel: z
    .string({ message: 'Responsável é obrigatório' })
    .min(2, 'Responsável deve ter no mínimo 2 caracteres')
    .max(100, 'Responsável muito longo'),
});

export type IniciarEtapaInput = z.infer<typeof iniciarEtapaSchema>;
```

### 5.2 Service — `etapas.service.ts`

```typescript
// src/services/etapas.service.ts
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Nomes das 12 etapas do Padrão Umarizal
 */
export const ETAPAS_NOMES: Record<number, string> = {
  1: 'Coleta',
  2: 'Documentação',
  3: 'Aspiração',
  4: 'Lavagem',
  5: 'Higienização',
  6: 'Centrifugação',
  7: 'Estendagem',
  8: 'Estufa',
  9: 'Escovação',
  10: 'Inspeção Final',
  11: 'Embalagem',
  12: 'Devolução',
};

/**
 * Mapeamento etapa → perfil permitido
 */
export const ETAPA_PERFIL: Record<number, string[]> = {
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

/**
 * Inicia uma etapa (status = em_andamento)
 */
export async function iniciarEtapa(
  orcamentoId: string,
  etapa: number,
  responsavel: string,
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

  // 3. Verifica se já existe registro para esta etapa
  const existente = await prisma.etapaProducao.findUnique({
    where: { orcamentoId_etapa: { orcamentoId, etapa } },
  });

  if (existente && existente.status === 'em_andamento') {
    throw new AppError(
      `Etapa ${etapa} (${nomeEtapa}) já está em andamento`,
      409,
      'ETAPA_JA_EM_ANDAMENTO',
    );
  }

  if (existente && existente.status === 'concluida') {
    throw new AppError(
      `Etapa ${etapa} (${nomeEtapa}) já foi concluída`,
      409,
      'ETAPA_JA_CONCLUIDA',
    );
  }

  // 4. Cria ou atualiza o registro
  const agora = new Date();
  const result = await prisma.etapaProducao.upsert({
    where: { orcamentoId_etapa: { orcamentoId, etapa } },
    update: {
      status: 'em_andamento',
      responsavel,
      concluidoEm: null,
      observacoes: null,
    },
    create: {
      orcamentoId,
      etapa,
      nome: nomeEtapa,
      status: 'em_andamento',
      responsavel,
    },
  });

  // 5. Registra evento de produção (histórico)
  // Segue o mesmo padrão de agendamento.controller.ts (linha 136)
  await prisma.eventoProducao.create({
    data: {
      orcamentoId,
      tipo: 'INICIO_PRODUCAO',
      descricao: `Etapa ${etapa} (${nomeEtapa}) iniciada por ${responsavel}`,
      usuarioId: usuarioId || null,
    },
  });

  return result;
}

/**
 * Retorna o status de todas as 12 etapas de um orçamento
 */
export async function listarEtapas(orcamentoId: string) {
  const etapas = await prisma.etapaProducao.findMany({
    where: { orcamentoId },
    orderBy: { etapa: 'asc' },
  });

  // Monta objeto com todas as 12 etapas (preenche com pendente as que não existem)
  const resultado: Record<number, { etapa: number; nome: string; status: string; responsavel?: string; concluidoEm?: Date | null; observacoes?: string | null }> = {};

  for (let i = 1; i <= 12; i++) {
    const encontrada = etapas.find(e => e.etapa === i);
    resultado[i] = encontrada
      ? {
          etapa: encontrada.etapa,
          nome: encontrada.nome,
          status: encontrada.status,
          responsavel: encontrada.responsavel || undefined,
          concluidoEm: encontrada.concluidoEm,
          observacoes: encontrada.observacoes,
        }
      : {
          etapa: i,
          nome: ETAPAS_NOMES[i] || `Etapa ${i}`,
          status: 'pendente',
        };
  }

  return resultado;
}
```

### 5.3 Controller — `etapas.controller.ts`

```typescript
// src/controllers/etapas.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as etapasService from '../services/etapas.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

/**
 * POST /api/etapas/:orcamentoId/iniciar
 * Inicia uma etapa de produção
 */
export async function iniciarEtapa(req: Request, res: Response, next: NextFunction) {
  try {
    const orcamentoId = String(req.params['orcamentoId']);
    const { etapa, responsavel } = req.body;
    const usuarioId = (req as any).user?.id as number | undefined;

    const result = await etapasService.iniciarEtapa(orcamentoId, etapa, responsavel, usuarioId);
    sendSuccess(res, result, `Etapa ${etapa} iniciada com sucesso`);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/etapas/:orcamentoId
 * Lista o status de todas as 12 etapas
 */
export async function listarEtapas(req: Request, res: Response, next: NextFunction) {
  try {
    const orcamentoId = String(req.params['orcamentoId']);
    const etapas = await etapasService.listarEtapas(orcamentoId);
    sendSuccess(res, etapas);
  } catch (err) {
    next(err);
  }
}
```

### 5.4 Routes — `etapas.routes.ts`

```typescript
// src/routes/etapas.routes.ts
/**
 * Rotas de Etapas de Produção
 *
 * POST  /api/etapas/:orcamentoId/iniciar  → Iniciar etapa
 * GET   /api/etapas/:orcamentoId           → Listar etapas
 */

import { Router } from 'express';
import * as etapasController from '../controllers/etapas.controller';
import { authenticate } from '../middleware/auth';
import { requirePerfil } from '../middleware/permissions';
import { validate } from '../middleware/validate';
import { iniciarEtapaSchema } from '../validators/etapas.validator';

const router = Router();

router.use(authenticate);

router.post('/:orcamentoId/iniciar',
  validate(iniciarEtapaSchema),
  etapasController.iniciarEtapa,
);

router.get('/:orcamentoId',
  etapasController.listarEtapas,
);

export default router;
```

> **Nota sobre permissão:** A validação de perfil específico por etapa será feita no **controller/service**, não na rota, pois o perfil permitido varia conforme a `etapa` no body. Um middleware de rota não consegue ler o body ainda. Implementação:

```typescript
// Dentro de etapas.service.ts — validar perfil
const perfisPermitidos = ETAPA_PERFIL[etapa];
const userPerfis = req.user?.perfis || [];
if (!userPerfis.includes('admin') && !perfisPermitidos.some(p => userPerfis.includes(p))) {
  throw new AppError('Você não tem permissão para iniciar esta etapa', 403, 'FORBIDDEN');
}
```

### 5.5 Routes Index — Registrar novo módulo

Em `src/routes/index.ts`, adicionar:

```typescript
import etapasRoutes from "./etapas.routes";
// ...
router.use("/etapas", etapasRoutes);
```

---

## 5.6 Painel Admin — Formulário de Criação de Usuário

### 5.6.1 `criar.astro` — Adicionar checkboxes de perfis do app

O formulário atual tem apenas um `<select name="nivel">` para o nível de acesso. Vamos adicionar uma seção de checkboxes para os perfis do app (motorista, expedicao, lavagem, secagem) e enviar `perfisApp` no body.

**Alteração no HTML** (após o select de nivel, antes do checkbox ativo):

```html
<!-- NOVO: Perfis do App -->
<fieldset class="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
  <legend class="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
    Perfis do App (opcional)
  </legend>
  <div class="space-y-2 mt-2">
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="perfisApp" value="motorista" class="rounded border-gray-300" />
      Motorista — Coletas, entregas e rota do dia
    </label>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="perfisApp" value="expedicao" class="rounded border-gray-300" />
      Expedição — Documentação, aspiração, inspeção, embalagem
    </label>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="perfisApp" value="lavagem" class="rounded border-gray-300" />
      Lavagem — Etapas 4 a 6 (lavagem, higienização, centrifugação)
    </label>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="perfisApp" value="secagem" class="rounded border-gray-300" />
      Secagem — Etapas 7 a 9 (estendagem, estufa, escovação)
    </label>
  </div>
</fieldset>
```

**Alteração no JavaScript** (no body do fetch):

```javascript
// NOVO: coletar perfis marcados
const perfisSelecionados = Array.from(
  document.querySelectorAll('input[name="perfisApp"]:checked')
).map(cb => cb.value);

var res = await fetch('/api/usuarios/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  body: JSON.stringify({
    nome: form.nome.value,
    email: form.email.value,
    senha: form.senha.value,
    nivel: form.nivel.value,
    perfisApp: perfisSelecionados,  // NOVO
    ativo: form.ativo.checked,
  }),
});
```

### 5.6.2 `UsuariosList.jsx` — Exibir tags de perfis

A lista de usuários atualmente mostra apenas um badge com o `nivel`. Vamos adicionar tags coloridas para os `perfis` do app.

**Alteração no componente:**

```jsx
// NOVO: paleta de cores para perfis do app
const PERFIS_APP = [
  { value: 'motorista', label: 'Motorista', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { value: 'expedicao', label: 'Expedição', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'lavagem', label: 'Lavagem', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'secagem', label: 'Secagem', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
];

// Na coluna "Nível", substituir o badge único por tags multiplas:
{/* ANTES: <span className={nivelColor(u.nivel)}>{nivelLabel(u.nivel)}</span> */}
{/* DEPOIS: */}
<div className="flex flex-wrap gap-1 items-center">
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${nivelColor(u.nivel)}`}>
    <Shield className="w-3 h-3" />
    {nivelLabel(u.nivel)}
  </span>
  {u.perfis?.filter(p => p !== u.nivel).map(p => {
    const cfg = PERFIS_APP.find(pa => pa.value === p);
    return cfg ? (
      <span key={p} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
        {cfg.label}
      </span>
    ) : null;
  })}
</div>
```

> **Nota:** Ao editar o nivel no modo de edição, manter o select existente. A edição de perfis (multi-checkbox) será feita em tarefa futura (A9).

---

```bash
# Iniciar etapa 4 (Lavagem) para um orçamento
curl -s -X POST 'https://api.lavanderiaumarizal.com.br/api/etapas/SEU_ORCAMENTO_ID/iniciar' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"etapa": 4, "responsavel": "João da Lavagem"}' | python3 -m json.tool

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "orcamentoId": "...",
#     "etapa": 4,
#     "nome": "Lavagem",
#     "status": "em_andamento",
#     "responsavel": "João da Lavagem",
#     "concluidoEm": null,
#     "observacoes": null
#   },
#   "message": "Etapa 4 iniciada com sucesso"
# }

# Listar etapas do orçamento
curl -s 'https://api.lavanderiaumarizal.com.br/api/etapas/SEU_ORCAMENTO_ID' \
  -H 'Authorization: Bearer SEU_TOKEN' | python3 -m json.tool
```

---

## 7. Testes de Validação

| # | Cenário | Como testar | Resultado esperado |
|---|---------|-------------|-------------------|
| T1 | Iniciar etapa válida | `POST /etapas/:id/iniciar { etapa: 4, responsavel: "João" }` | 200 + status="em_andamento" |
| T2 | Etapa fora do range | `{ etapa: 0 }` ou `{ etapa: 13 }` | 400 "Etapa deve ser entre 1 e 12" |
| T3 | Etapa já em andamento | Repetir T1 duas vezes | 409 "já está em andamento" |
| T4 | Etapa já concluída | Tentar iniciar etapa já concluída | 409 "já foi concluída" |
| T5 | Orçamento inexistente | `POST /etapas/uuid-invalido/iniciar` | 404 "Orçamento não encontrado" |
| T6 | Sem responsável | `{ etapa: 4 }` | 400 validação Zod |
| T7 | Sem autenticação | Request sem token | 401 |
| T8 | Perfil não autorizado | Lavagem tenta iniciar etapa 10 (inspeção) | 403 "Sem permissão" |
| T9 | **Criar usuario com perfisApp no admin** | Criar usuario via `/admin/usuarios/criar/` marcando checkboxes | Usuario criado com `perfis` visiveis na lista |
| T10 | **Lista exibe tags de perfis** | Abrir `/admin/usuarios/` | Cada usuario mostra `nivel` + tags coloridas de `perfis` |

---

## 8. Procedimento de Deploy

```bash
# Passo 1: Desenvolvimento
cd /home/lavanderia/GitHub/backend

# Criar os 4 novos arquivos:
# - src/routes/etapas.routes.ts
# - src/controllers/etapas.controller.ts
# - src/services/etapas.service.ts
# - src/validators/etapas.validator.ts

# Alterar:
# - src/routes/index.ts (adicionar router.use)

cd /home/lavanderia/GitHub/site
# Alterar:
# - src/pages/admin/usuarios/criar.astro (checkboxes perfisApp)
# - src/components/admin/UsuariosList.jsx (tags de perfis)

# Passo 2: Verificar compilação
cd /home/lavanderia/GitHub/backend
npx tsc --noEmit

# Passo 3: Commit e push (ambos os repositorios)
cd /home/lavanderia/GitHub/backend
git add -A
git commit -m "feat: endpoint POST /api/etapas/:id/iniciar"
git push

cd /home/lavanderia/GitHub/site
git add -A
git commit -m "feat: admin usuarios - perfisApp no formulario e lista"
git push

# Passo 4: Deploy via Dokploy (backend)
curl -s -X POST 'http://vmi1352054.contaboserver.net:3000/api/application.deploy' \
  -H 'x-api-key: TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"applicationId": "Th6rDvBVOlkgnvMu_KD4q"}'

# Passo 5: Deploy do site (GitHub Pages - automatico no push)
# Nao precisa de acao manual
```

---

## 9. Riscos e Atenção

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Orçamento em fase errada** 🟡 | Tentar iniciar coleta em orçamento não aprovado | A validação de `faseAtual` pode ser adicionada futuramente. Por enquanto, qualquer etapa pode ser iniciada a qualquer momento |
| **Concorrência** 🟡 | Dois usuários iniciam a mesma etapa simultaneamente | O `@@unique([orcamentoId, etapa])` + `upsert` garante atomicidade |
| **Perfil validation no body** 🟡 | `requirePerfil` não consegue ler o body | A validação de perfil por etapa é feita no service, não no middleware de rota |
| **Sem migration** 🟢 | Nenhuma alteração no banco | Tabela `etapas_producao` já existe da B1 |
| **Orçamento deletado** 🟢 | `onDelete: Cascade` na FK | Se o orçamento for deletado, as etapas são deletadas automaticamente |

---

## 10. Próximos passos

Após a B5, o B6 (concluir etapa) e B7 (retornar etapa) seguirão a mesma estrutura, adicionando:
- **B6**: Sincronização com `fases.service.ts` — ao concluir certas etapas, avança a `faseAtual`
- **B7**: Registro de motivo no `observacoes` + disparo de notificação se necessário
