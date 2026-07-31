# Adequações do Painel Admin — Multi-perfil e Privacidade de Dados

## 1. Contexto

O painel admin em `lavanderiaumarizal.com.br/admin/usuarios/` gerencia os usuários do sistema. Atualmente ele usa o campo `nivel` (string única) para definir o perfil de acesso. Com a nova abordagem **multi-perfil** do app, o painel admin precisa ser atualizado para:

1. Suportar a criação/edição de usuários com múltiplos perfis
2. Exibir claramente quais perfis cada usuário possui
3. Manter compatibilidade com o campo `nivel` existente

## 2. Arquivos Envolvidos

### Backend (API)
| Arquivo | Caminho | O que precisa mudar |
|---------|---------|---------------------|
| Types | `backend/src/types/index.ts` | `AuthPayload.nivel` → `AuthPayload.perfis: string[]`. `CreateUsuarioInput` ganha campo `perfisApp` |
| Service | `backend/src/services/auth.service.ts` | `createUsuario` e `updateUsuario` aceitam `perfisApp`. `login` retorna `perfis` |
| JWT | `backend/src/lib/jwt.ts` | Token JWT contém `perfis` (array) em vez de `nivel` (string) |
| Routes | `backend/src/routes/auth.routes.ts` | Novo endpoint `PATCH /api/usuarios/:id/perfis` |
| Middleware | `backend/src/middleware/permissions.ts` | `requireNivel` vira `requirePerfil` (aceita array, admin sempre passa) |
| Schema | `backend/prisma/schema.prisma` | Adicionar campo `perfisApp String?` ao model `Usuario` |

### Frontend (Site/Admin)
| Arquivo | Caminho | O que precisa mudar |
|---------|---------|---------------------|
| Lista | `site/src/components/admin/UsuariosList.jsx` | Mostrar múltiplos perfis por usuário (tags/chips). Edição multi-select |
| Criar | `site/src/pages/admin/usuarios/criar.astro` | Formulário com checkboxes de perfis em vez de select único |
| API lib | `site/src/lib/api.js` (ou similar) | Enviar `perfisApp` no body |

## 3. O que precisa mudar — Detalhado

> **ATUALIZAÇÃO (30/07/2026):** As tarefas A9 e A10 já foram implementadas como parte da B5.
> O formulário de criação e a lista de usuários agora usam perfis unificados.
> Veja detalhes em `SPRINT1_B5_DETALHAMENTO.md` seção 5.6.

### 3.1 Backend — Schema Prisma

```prisma
model Usuario {
  id           Int      @id @default(autoincrement())
  nome         String
  email        String   @unique
  senha        String
  nivel        String   @default("operador") // Mantido para compatibilidade
  perfisApp    String?  @map("perfis_app")   // NOVO: JSON array '["motorista","expedicao"]'
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  transportador Transportador?

  @@map("usuarios")
}
```

### 3.2 Backend — Types

```typescript
// types/index.ts
export type AuthPayload = {
  sub: number | string;
  email: string;
  nivel: string;     // Mantido para compatibilidade com sistema legado
  perfis: string[];  // NOVO: array de perfis para o app
  clienteId?: string;
};

export type CreateUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
  nivel?: string;
  perfisApp?: string[];  // NOVO
  ativo?: boolean;
};
```

### 3.3 Backend — Auth Service

No `createUsuario`, ao receber `perfisApp`, salvar como JSON string:
```typescript
data: {
  nome: input.nome,
  email: input.email,
  senha: senhaHash,
  nivel: input.nivel || 'operador',
  perfisApp: input.perfisApp ? JSON.stringify(input.perfisApp) : null,
  ativo: input.ativo !== undefined ? input.ativo : true,
}
```

No `login`, retornar perfis parseados:
```typescript
return {
  token,
  usuario: {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    nivel: usuario.nivel,
    perfis: usuario.perfisApp ? JSON.parse(usuario.perfisApp) : [usuario.nivel],
  },
};
```

No JWT, incluir `perfis`:
```typescript
const payload: AuthPayload = {
  sub: usuario.id,
  email: usuario.email,
  nivel: usuario.nivel,
  perfis: usuario.perfisApp ? JSON.parse(usuario.perfisApp) : [usuario.nivel],
};
```

### 3.4 Backend — Novo Endpoint: Gerenciar Perfis

```
PATCH /api/usuarios/:id/perfis
Body: { perfis: string[] }
Auth: Admin apenas
Response: { id, nome, email, nivel, perfisApp }
```

### 3.5 Backend — Middleware de Permissão

O middleware `requireNivel` existente deve ser adaptado ou criar-se um novo `requirePerfil`:

```typescript
// middleware/permissions.ts
export function requirePerfil(...perfis: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Não autenticado');
    }

    // Admin sempre tem acesso
    const userPerfis = req.user.perfis || [req.user.nivel];
    if (userPerfis.includes('admin')) {
      return next();
    }

    // Verifica se tem PELO MENOS UM dos perfis exigidos
    const temAcesso = perfis.some(p => userPerfis.includes(p));
    if (!temAcesso) {
      return sendError(res, 403, 'FORBIDDEN', 'Sem permissão para esta ação');
    }

    next();
  };
}
```

### 3.6 Frontend — Formulário de Criação

O select único de nível deve ser substituído por checkboxes multi-perfil:

```html
<!-- NOVO: em vez de <select name="nivel"> -->
<fieldset>
  <legend class="text-sm font-medium mb-2">Perfis de Acesso (app)</legend>
  <div class="space-y-2">
    <label class="flex items-center gap-2">
      <input type="checkbox" name="perfis" value="motorista" />
      Motorista — Coletas, entregas e rota do dia
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" name="perfis" value="expedicao" />
      Expedição — Documentação, aspiração, inspeção, embalagem
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" name="perfis" value="lavagem" />
      Lavagem — Etapas 4 a 6 (lavagem, higienização, centrifugação)
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" name="perfis" value="secagem" />
      Secagem — Etapas 7 a 9 (estendagem, estufa, escovação)
    </label>
  </div>
</fieldset>

<!-- Mantido para compatibilidade (nível do backend): -->
<select name="nivel" class="hidden">
  <option value="operador" selected>Operador</option>
  <option value="admin">Admin</option>
</select>
```

### 3.7 Frontend — Lista de Usuários

Cada linha da tabela deve mostrar múltiplas tags de perfil em vez de uma única:

```jsx
// NOVO em UsuariosList.jsx — em vez de:
// <span class="nivelColor(u.nivel)">{nivelLabel(u.nivel)}</span>

// Agora:
<div className="flex flex-wrap gap-1">
  {u.perfis?.map(p => (
    <span key={p} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${perfilColor(p)}`}>
      {perfilLabel(p)}
    </span>
  )) || (
    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
      {nivelLabel(u.nivel)} (legado)
    </span>
  )}
</div>
```

### 3.8 Frontend — Edição de Perfis

No modo de edição, substituir o select único por checkboxes múltiplos:

```jsx
function EditarPerfis({ usuario, onSave, onCancel }) {
  const [perfis, setPerfis] = useState(usuario.perfis || []);
  
  const ALL_PERFIS = [
    { value: 'admin', label: 'Admin', desc: 'Acesso total' },
    { value: 'motorista', label: 'Motorista', desc: 'Coletas e entregas' },
    { value: 'expedicao', label: 'Expedição', desc: 'Documentação, inspeção' },
    { value: 'lavagem', label: 'Lavagem', desc: 'Etapas 4-6' },
    { value: 'secagem', label: 'Secagem', desc: 'Etapas 7-9' },
  ];

  function togglePerfil(value) {
    setPerfis(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_PERFIS.map(p => (
        <button
          key={p.value}
          onClick={() => togglePerfil(p.value)}
          className={`px-2 py-1 rounded-full text-xs font-medium border ${
            perfis.includes(p.value)
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
          title={p.desc}
        >
          {p.label}
        </button>
      ))}
      <button onClick={() => onSave(perfis)}>✓</button>
      <button onClick={onCancel}>✗</button>
    </div>
  );
}
```

## 4. Tarefas

As tarefas abaixo devem ser executadas APÓS a finalização do app (umarizal.app), pois o app depende do backend multi-perfil, mas o painel admin é apenas a interface de gestão.

| # | Tarefa | Descrição | Arquivos | Estimativa |
|---|--------|-----------|----------|------------|
| A1 | **Adicionar campo `perfisApp` ao schema Prisma** | Adicionar coluna `perfis_app TEXT` à tabela `usuarios`. Gerar migração | `prisma/schema.prisma` | 30min |
| A2 | **Atualizar `AuthPayload` e `CreateUsuarioInput`** | Adicionar `perfis: string[]` ao AuthPayload. Adicionar `perfisApp?: string[]` ao CreateUsuarioInput | `src/types/index.ts` | 15min |
| A3 | **Atualizar `auth.service.ts`** | `createUsuario`: salvar `perfisApp` como JSON. `login`: retornar `perfis` parseado. `updateUsuario`: aceitar `perfisApp`. `listUsuarios`: incluir `perfisApp` no select | `src/services/auth.service.ts` | 1h |
| A4 | **Atualizar `auth.controller.ts`** | Garantir que endpoints de listagem/consulta retornem `perfisApp` | `src/controllers/auth.controller.ts` | 15min |
| A5 | **Criar endpoint `PATCH /api/usuarios/:id/perfis`** | Endpoint admin para alterar perfis de um usuário | `src/routes/auth.routes.ts`, `src/services/auth.service.ts`, `src/controllers/auth.controller.ts` | 30min |
| A6 | **Criar middleware `requirePerfil()`** | Função que aceita array de perfis. Admin sempre passa. Usuário precisa de pelo menos 1 perfil dos exigidos | `src/middleware/permissions.ts` | 30min |
| A7 | **Atualizar JWT** | Incluir `perfis` no payload do token. Adaptar `generateToken` e `verifyToken` | `src/lib/jwt.ts` | 15min |
| A8 | **Atualizar `login` do admin** | O endpoint `POST /api/auth/login` deve retornar `perfis` no JWT e na response, compatível com o novo formato | `src/services/auth.service.ts` | 15min |
| A9 | **Atualizar `UsuariosList.jsx`** | Mostrar múltiplas tags de perfil. Edição multi-checkbox em vez de select único | `site/src/components/admin/UsuariosList.jsx` | 2h |
| A10 | **Atualizar formulário de criação** | Substituir select por checkboxes. Enviar `perfisApp` como array no body. Manter `nivel` oculto para compatibilidade | `site/src/pages/admin/usuarios/criar.astro` | 1h |
| A11 | **Testar fluxo completo** | Criar usuário com múltiplos perfis → logar no app → verificar permissões → editar perfis → verificar mudanças | — | 1h |
| A12 | **Documentar novo fluxo** | Atualizar manual/admin sobre como gerenciar perfis de usuários | `doc/` | 30min |

**Total estimado:** ~7h

## 5. Compatibilidade Retroativa

É fundamental que usuários existentes (com `nivel` definido, mas sem `perfisApp`) continuem funcionando:

| Cenário | Comportamento |
|---------|---------------|
| Usuário com `perfisApp = NULL` e `nivel = "admin"` | Backend trata como `perfis = ["admin"]` |
| Usuário com `perfisApp = NULL` e `nivel = "motorista"` | Backend trata como `perfis = ["motorista"]` |
| Usuário com `perfisApp = '["motorista","expedicao"]'` | Usa o array de perfis normalmente |
| Usuário admin logando no painel admin web | Continua funcionando via `nivel` existente |

**Regra no backend:**
```typescript
function getPerfis(usuario: { nivel: string; perfisApp: string | null }): string[] {
  if (usuario.perfisApp) {
    return JSON.parse(usuario.perfisApp);
  }
  // Fallback: usa o nivel como unico perfil
  return [usuario.nivel];
}
```
