# Plano de Implementação — B3.1: Endpoint `PATCH /api/usuarios/:id/perfis`

## 1. O que precisa ser feito

Criar um endpoint administrativo para gerenciar os perfis (`perfisApp`) de um usuário sem precisar alterar os demais dados (nome, email, senha, etc.).

### Por que um endpoint separado?

O `PUT /api/usuarios/:id` existente permite alterar todos os campos do usuário, mas exige que o frontend envie o body completo. O novo endpoint `PATCH /:id/perfis` é **específico para perfis** — recebe apenas o array de perfis e atualiza somente o campo `perfisApp`.

### Dependências

```
B3 (multi-perfil) ✅ → B3.1 (endpoint perfis) → B4 (login-motorista)
```

B3.1 só pode ser implementada **após a B3** (já concluída), pois depende do campo `perfisApp` existir no banco.

---

## 2. Arquivos que serão alterados

| # | Arquivo | Ação | Impacto |
|---|---------|------|---------|
| 1 | `src/routes/auth.routes.ts` | Adicionar rota `PATCH /:id/perfis` | 🟢 Baixo |
| 2 | `src/controllers/auth.controller.ts` | Adicionar funcao `updatePerfis()` | 🟢 Baixo |
| 3 | `src/services/auth.service.ts` | Adicionar funcao `updateUsuarioPerfis()` | 🟢 Baixo |

---

## 3. Código

### 3.1 Route

```typescript
// routes/auth.routes.ts — adicionar antes de DELETE /:id

router.patch("/:id/perfis", authenticate, requireAdmin, authController.updatePerfis);

// A ordem no arquivo:
// router.get("/:id", ...)
// router.put("/:id", ...)
// router.patch("/:id/perfis", ...)  ← NOVO
// router.patch("/:id/toggle-status", ...)
// router.delete("/:id", ...)
```

### 3.2 Controller

```typescript
// controllers/auth.controller.ts

/**
 * PATCH /api/usuarios/:id/perfis
 * Body: { perfis: string[] }
 */
export async function updatePerfis(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params['id']));
    const { perfis } = req.body;

    if (!Array.isArray(perfis)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Campo "perfis" deve ser um array de strings');
    }

    const usuario = await authService.updateUsuarioPerfis(id, perfis);
    sendSuccess(res, usuario, 'Perfis atualizados com sucesso');
  } catch (err) {
    next(err);
  }
}
```

### 3.3 Service

```typescript
// services/auth.service.ts

/**
 * Atualiza APENAS os perfis (perfisApp) de um usuário
 * @param id - ID do usuário
 * @param perfis - Array de perfis (ex: ['motorista', 'expedicao'])
 */
export async function updateUsuarioPerfis(id: number, perfis: string[]) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: {
      perfisApp: perfis.length > 0 ? JSON.stringify(perfis) : null,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      perfisApp: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  return {
    ...updated,
    perfis: getPerfisFromUsuario(updated),
  };
}
```

---

## 4. Exemplo de uso

```bash
# Buscar ID do usuário
curl -s 'https://api.lavanderiaumarizal.com.br/api/usuarios/' \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)['data']
for u in d: print(f'{u[\"id\"]}: {u[\"nome\"]} - perfis: {u.get(\"perfis\",[])}')
"

# Atualizar perfis do usuário ID=3
curl -s -X PATCH 'https://api.lavanderiaumarizal.com.br/api/usuarios/3/perfis' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"perfis": ["motorista", "expedicao"]}' | python3 -m json.tool

# Remover todos os perfis (volta ao fallback [nivel])
curl -s -X PATCH 'https://api.lavanderiaumarizal.com.br/api/usuarios/3/perfis' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"perfis": []}' | python3 -m json.tool
```

---

## 5. SQL da Migration

Nenhuma — o campo `perfis_app` já foi criado na B3.

---

## 6. Testes de Validação

| # | Cenário | Como testar | Resultado esperado |
|---|---------|-------------|-------------------|
| T1 | Atualizar perfis | `PATCH /api/usuarios/3/perfis` com `["motorista","expedicao"]` | 200 + usuário com `perfis: ["motorista","expedicao"]` |
| T2 | Remover perfis | `PATCH /api/usuarios/3/perfis` com `[]` | 200 + `perfis: ["motorista"]` (fallback para nivel) |
| T3 | Usuário inexistente | `PATCH /api/usuarios/999/perfis` | 404 "Usuário não encontrado" |
| T4 | Sem token | `PATCH` sem Authorization | 401 |
| T5 | Token não-admin | `PATCH` com token de motorista | 403 |
| T6 | Body inválido | `PATCH` com `{"perfis": "invalido"}` | 400 "deve ser um array" |

---

## 7. Procedimento de Deploy

```bash
# Passo 1: Fazer push do código (schema/types/service já foram alterados na B3)
git add -A && git commit -m "feat: endpoint PATCH /:id/perfis"
git push

# Passo 2: Deploy via Dokploy (automático ou manual)

# Passo 3: No container, apenas regenerar client (sem migration)
cd /app
npx prisma generate

# Passo 4: Testar
curl -s -X PATCH 'http://localhost:3001/api/usuarios/3/perfis' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"perfis": ["motorista", "expedicao"]}' | python3 -m json.tool
```

---

## 8. Riscos e Atenção

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Perfis inválidos** 🟡 | Usuário pode receber perfis que não existem | A validação pode ser adicionada futuramente (comparar com enum). Por enquanto, aceita qualquer string |
| **Array vazio** 🟢 | `perfisApp` fica NULL → fallback `[nivel]` | Comportamento intencional para resetar perfis |
| **Não-admin acessar** 🔴 | Motorista alterar próprios perfis | Rota protegida com `requireAdmin` |
| **Sem migration** 🟢 | Nenhuma alteração no banco | Campo `perfisApp` já existe da B3 |
