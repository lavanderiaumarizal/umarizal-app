# Plano de Implementação — B2: Criar tabela `carregamento_veiculo`

## 1. O que precisa ser feito

Adicionar o model `CarregamentoVeiculo` ao schema Prisma do backend para rastrear quais orçamentos/tapetes foram carregados no veículo para entrega. Substitui a "flag de caneta" da planilha manual — um toggle que o motorista ou expedição usa para marcar que o tapete físico está dentro do carro.

### Funcionalidades que dependem desta tabela

- **App (F27):** Checkbox "Carregado no veículo" no Almoxarifado
- **App (F14):** Flag visível na rota do dia
- **Backend (B11):** `POST /api/orcamentos/:id/carregar` — marca como carregado
- **Backend (B12):** `DELETE /api/orcamentos/:id/carregar` — remove flag
- **Logística:** Ajuda a localizar o tapete físico no estoque vs veículo

---

## 2. Localização no Schema

O novo model deve ser inserido **após o model `EtapaProducao`** (que termina aproximadamente na linha 360) e **antes da seção de PAGAMENTOS**, seguindo a ordem lógica do schema.

**Linha exata:** entre o `@@map("etapas_producao")` e o comentário `// PAGAMENTOS — Log de Transações`.

---

## 3. Código Prisma

```prisma
// ============================================================
// CARREGAMENTO DE VEÍCULO — Flag de entrada/saída do estoque
// ============================================================

model CarregamentoVeiculo {
  id          String   @id @default(uuid())
  orcamentoId String   @unique @map("orcamento_id")
  carregadoEm DateTime @default(now()) @map("carregado_em")
  usuarioId   Int      @map("usuario_id")
  veiculo     String   @default("principal") // principal | reserva

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  usuario   Usuario   @relation(fields: [usuarioId], references: [id])

  @@index([orcamentoId])
  @@index([usuarioId])
  @@map("carregamento_veiculo")
}
```

### Detalhamento dos campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String @id @default(uuid())` | UUID v4 — chave primária |
| `orcamentoId` | `String @unique` | FK para `orcamentos.id` (1:1 — cada orçamento carregado uma vez) |
| `carregadoEm` | `DateTime @default(now())` | Timestamp de quando foi carregado no veículo |
| `usuarioId` | `Int` | FK para `usuarios.id` — quem marcou como carregado |
| `veiculo` | `String @default("principal")` | Identificação do veículo (principal, reserva, etc.) |

### Constraints e Índices

| Nome | Tipo | Descrição |
|------|------|-----------|
| `@@unique([orcamentoId])` | Unique constraint | Garante 1:1 — cada orçamento só pode estar em 1 veículo por vez |
| `@@index([orcamentoId])` | Index | Otimiza buscas por orçamento |
| `@@index([usuarioId])` | Index | Otimiza buscas por usuário (quem carregou) |
| `onDelete: Cascade` | Relation (Orcamento) | Se o orçamento for deletado, o registro de carregamento também |

---

## 4. Relações com models existentes

### Em `Orcamento` (adicionar ao lado de `etapasProducao`)

```prisma
carregamentoVeiculo CarregamentoVeiculo?  // NOVO — opcional (1:1)
```

**Localização exata:** junto com `etapasProducao` (linha 298), antes dos campos de gateway:

```prisma
  historicoFases      HistoricoFase[]
  notificacoes        NotificacaoEnviada[]
  etapasProducao      EtapaProducao[]
  carregamentoVeiculo CarregamentoVeiculo?  // ← NOVO
```

### Em `Usuario` (adicionar ao final do bloco de relações)

```prisma
  carregamentos CarregamentoVeiculo[]  // NOVO
```

**Localização exata:** após `transportador Transportador?` (linha 29), antes de `@@map("usuarios")`:

```prisma
  transportador Transportador?
  carregamentos CarregamentoVeiculo[]  // ← NOVO
```

---

## 5. Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| **1:1 com Orcamento** | Um orçamento só pode estar carregado uma vez. Se já estiver carregado, o endpoint `POST /carregar` deve retornar erro 409 ou atualizar o registro existente |
| **Remoção (descarregar)** | `DELETE /carregar` remove o registro. O orçamento volta a ficar "não carregado" |
| **Re-carregamento** | Após remover, pode carregar novamente — novo registro com novo timestamp |
| **Visibilidade** | A flag aparece no Almoxarifado (app) e no painel admin |
| **Sem orçamento = sem carregamento** | Se o orçamento for excluído (`onDelete: Cascade`), o carregamento também é excluído |

---

## 6. SQL da Migration

```sql
-- CreateTable: carregamento_veiculo
CREATE TABLE "carregamento_veiculo" (
    "id" TEXT NOT NULL,
    "orcamento_id" UUID NOT NULL,
    "carregado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,
    "veiculo" TEXT NOT NULL DEFAULT 'principal',

    CONSTRAINT "carregamento_veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carregamento_veiculo_orcamento_id_key" ON "carregamento_veiculo"("orcamento_id");

-- CreateIndex
CREATE INDEX "carregamento_veiculo_orcamento_id_idx" ON "carregamento_veiculo"("orcamento_id");

-- CreateIndex
CREATE INDEX "carregamento_veiculo_usuario_id_idx" ON "carregamento_veiculo"("usuario_id");

-- AddForeignKey: orcamento_id → orcamentos.id
ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_orcamento_id_fkey"
    FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: usuario_id → usuarios.id
ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Nota sobre `ON DELETE` do `usuario_id`

| Opção | Comportamento | Escolhida? |
|-------|---------------|------------|
| `RESTRICT` | Impede deletar usuário se ele tiver carregamentos | ✅ **Sim** — segurança para não perder o rastro de quem carregou |
| `CASCADE` | Deletaria os carregamentos se o usuário for deletado | ❌ Não — perderia auditoria |
| `SET NULL` | Manteria o registro sem o usuário | ❌ Não — `usuarioId` não é nullable |

---

## 7. Arquivos que serão alterados

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Adicionar model `CarregamentoVeiculo` + relação em `Orcamento` + relação em `Usuario` |

## 8. Comandos para aplicar

```bash
# No container de produção:
cd /app

# 1. Gerar migration SQL (executar via db execute para evitar conflito com migração anterior)
echo 'CREATE TABLE IF NOT EXISTS "carregamento_veiculo" (
    "id" TEXT NOT NULL,
    "orcamento_id" UUID NOT NULL,
    "carregado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,
    "veiculo" TEXT NOT NULL DEFAULT '\''principal'\'',
    CONSTRAINT "carregamento_veiculo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "carregamento_veiculo_orcamento_id_key" ON "carregamento_veiculo"("orcamento_id");
CREATE INDEX IF NOT EXISTS "carregamento_veiculo_orcamento_id_idx" ON "carregamento_veiculo"("orcamento_id");
CREATE INDEX IF NOT EXISTS "carregamento_veiculo_usuario_id_idx" ON "carregamento_veiculo"("usuario_id");' | npx prisma db execute --stdin

# 2. Adicionar FK orcamento_id
echo 'DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '\''carregamento_veiculo_orcamento_id_fkey'\'') THEN
    ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_orcamento_id_fkey"
      FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;' | npx prisma db execute --stdin

# 3. Adicionar FK usuario_id
echo 'DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '\''carregamento_veiculo_usuario_id_fkey'\'') THEN
    ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;' | npx prisma db execute --stdin

# 4. Gerar migration folder para rastreamento (opcional)
# mkdir -p prisma/migrations/20260731000000_add_carregamento_veiculo
# (copiar SQL acima para migration.sql)

# 5. Regenerar client
npx prisma generate
```

---

## 9. Riscos e Atenção (lições da B1)

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Migration anterior com falha** 🔴 | `migrate deploy` bloqueado | Já resolvido na B1 — migration `20260711120000` marcada como rolled-back |
| **`db push` bloqueado por generated column** 🟡 | `db push` falha em `historico_fases` | Usar `db execute` com SQL direto — sem `db push` |
| **Tabela criada pelo entrypoint antes do deploy** 🟡 | `migrate deploy` falha com "already exists" | Usar `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` + `DO $$...$$` para FKs |
| **Prisma Client desatualizado** 🟢 | Modelo não reconhecido pelo código | Rodar `npx prisma generate` após criar a tabela |
| **`@@unique([orcamentoId])` violado** 🟡 | Dois registros para o mesmo orçamento | O endpoint deve verificar existência antes de criar (`findUnique` + `upsert`) |

---

## 10. Procedimento de Deploy Seguro

```bash
# Passo 1: No container, marcar migration como resolvida ANTES
cd /app

# Passo 2: Criar pasta de migration (para rastreamento)
mkdir -p prisma/migrations/20260731000000_add_carregamento_veiculo

# Passo 3: SQL da migration
cat > prisma/migrations/20260731000000_add_carregamento_veiculo/migration.sql << 'EOF'
-- CreateTable: carregamento_veiculo
CREATE TABLE IF NOT EXISTS "carregamento_veiculo" (
    "id" TEXT NOT NULL,
    "orcamento_id" UUID NOT NULL,
    "carregado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,
    "veiculo" TEXT NOT NULL DEFAULT 'principal',
    CONSTRAINT "carregamento_veiculo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "carregamento_veiculo_orcamento_id_key" ON "carregamento_veiculo"("orcamento_id");
CREATE INDEX IF NOT EXISTS "carregamento_veiculo_orcamento_id_idx" ON "carregamento_veiculo"("orcamento_id");
CREATE INDEX IF NOT EXISTS "carregamento_veiculo_usuario_id_idx" ON "carregamento_veiculo"("usuario_id");
EOF

# Passo 4: Executar SQL direto no banco
cat prisma/migrations/20260731000000_add_carregamento_veiculo/migration.sql | npx prisma db execute --stdin

# Passo 5: Adicionar FKs (precisa ser separado do CREATE TABLE por causa do IF NOT EXISTS)
echo 'DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carregamento_veiculo_orcamento_id_fkey') THEN
    ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_orcamento_id_fkey"
      FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carregamento_veiculo_usuario_id_fkey') THEN
    ALTER TABLE "carregamento_veiculo" ADD CONSTRAINT "carregamento_veiculo_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;' | npx prisma db execute --stdin

# Passo 6: Marcar migration como applied
npx prisma migrate resolve --applied 20260731000000_add_carregamento_veiculo

# Passo 7: Regenerar client
npx prisma generate

# Passo 8: Commitar e fazer push (schema + migration folder)
```

---

## 11. Integração com o Entrypoint

O `docker-entrypoint.sh` atual (modificado na B1) já possui o fallback SQL genérico. Para a B2, **NÃO é necessário modificar o entrypoint** — o fallback existente só cobre `etapas_producao`. A B2 será aplicada manualmente via SQL direto (procedimento acima), que é mais seguro do que adicionar toda a lógica no entrypoint.
