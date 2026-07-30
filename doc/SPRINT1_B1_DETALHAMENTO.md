# Plano de Implementação — B1: Criar tabela `etapas_producao`

## 1. O que precisa ser feito

Adicionar o model `EtapaProducao` ao schema Prisma do backend para rastrear individualmente cada uma das 12 etapas do Padrão Umarizal.

---

## 2. Localização no Schema

O novo model deve ser inserido **após o model `Orcamento`** (linha 337) e **antes da seção de PAGAMENTOS** (linha 339), seguindo a ordem lógica do schema.

**Linha exata:** entre a linha 337 (`@@map("orcamentos")`) e a linha 339 (`// ============================================================`).

---

## 3. Código Prisma

```prisma
// ============================================================
// ETAPAS DE PRODUÇÃO — Controle granular das 12 etapas do app
// ============================================================

model EtapaProducao {
  id          Int      @id @default(autoincrement())
  orcamentoId String   @map("orcamento_id")
  etapa       Int      // 1 a 12
  nome        String   // Coleta, Documentação, Aspiração, Lavagem, ...
  status      String   @default("pendente") // pendente | em_andamento | concluida
  responsavel String?
  concluidoEm DateTime? @map("concluido_em")
  observacoes String?

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)

  @@unique([orcamentoId, etapa])
  @@index([orcamentoId])
  @@map("etapas_producao")
}
```

### Detalhamento dos campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `Int @id @default(autoincrement())` | Chave primária auto-incremento |
| `orcamentoId` | `String` | FK para `orcamentos.id` |
| `etapa` | `Int` | Número da etapa (1 a 12) |
| `nome` | `String` | Nome descritivo da etapa |
| `status` | `String @default("pendente")` | `pendente` \| `em_andamento` \| `concluida` |
| `responsavel` | `String?` | Nome de quem concluiu a etapa |
| `concluidoEm` | `DateTime?` | Timestamp de quando foi concluída |
| `observacoes` | `String?` | Observações opcionais |
| `@@unique([orcamentoId, etapa])` | Unique constraint | Garante 1 registro por etapa por orçamento |
| `@@index([orcamentoId])` | Index | Otimiza buscas por orçamento |
| `onDelete: Cascade` | Relation | Se o orçamento for deletado, as etapas também |

---

## 4. Relação com model `Orcamento`

No model `Orcamento`, adicionar a relação:

```prisma
etapasProducao EtapaProducao[]  // NOVO — junto com historicoFases e notificacoes
```

**Localização exata:** após a linha 296 (`historicoFases HistoricoFase[]`), antes dos campos de gateway.

---

## 5. Nomes das 12 Etapas

```typescript
const ETAPAS = [
  { etapa: 1,  nome: 'Coleta' },
  { etapa: 2,  nome: 'Documentação' },
  { etapa: 3,  nome: 'Aspiração' },
  { etapa: 4,  nome: 'Lavagem' },
  { etapa: 5,  nome: 'Higienização' },
  { etapa: 6,  nome: 'Centrifugação' },
  { etapa: 7,  nome: 'Estendagem' },
  { etapa: 8,  nome: 'Estufa' },
  { etapa: 9,  nome: 'Escovação' },
  { etapa: 10, nome: 'Inspeção Final' },
  { etapa: 11, nome: 'Embalagem' },
  { etapa: 12, nome: 'Devolução' },
];
```

---

## 6. Mapeamento Etapa → Fase Existente

Quando uma etapa é concluída, ela pode ou não disparar um avanço de fase no sistema existente:

| Etapa concluída | Avança faseAtual para? | Condição |
|-----------------|------------------------|----------|
| 1 — Coleta | `F1_COLETADO` | Imediato |
| 2 — Documentação | *(não avança)* | Aguarda etapa 3 |
| 3 — Aspiração | `F1_DOCUMENTACAO` | Se etapa 2 já foi concluída |
| 4 — Lavagem | `F2_F3_PRODUCAO` | Imediato |
| 5 — Higienização | *(não avança)* | Mesma fase |
| 6 — Centrifugação | *(não avança)* | Mesma fase |
| 7 — Estendagem | `SECAGEM` | Imediato |
| 8 — Estufa | *(não avança)* | Mesma fase |
| 9 — Escovação | *(não avança)* | Mesma fase |
| 10 — Inspeção Final | `F4_DEVOLUCAO` | Imediato |
| 11 — Embalagem | *(não avança)* | Mesma fase |
| 12 — Devolução | `ENTREGUE` | Imediato |

---

## 7. Script de Seed (B16)

Após criar a tabela, o seed (B16) deve popular as 12 etapas para cada orçamento existente com base no `faseAtual`:

| faseAtual atual | Etapas concluídas | Etapas pendentes |
|-----------------|-------------------|------------------|
| `F1_COLETADO` | 1 | 2 a 12 |
| `F1_DOCUMENTACAO` | 1, 2, 3 | 4 a 12 |
| `F2_F3_PRODUCAO` | 1 a 3 | 4 a 12 (ou até 6 se já avançou) |
| `SECAGEM` | 1 a 6 | 7 a 12 |
| `F4_DEVOLUCAO` | 1 a 9 | 10 a 12 |
| `ENTREGUE` | Todas (1 a 12) | Nenhuma |

---

## 8. Arquivos que serão alterados

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Adicionar model `EtapaProducao` + relação em `Orcamento` |

## 9. Comandos para aplicar

```bash
# No diretório do backend:
cd /home/lavanderia/GitHub/backend

# 1. Adicionar o model ao schema.prisma
# 2. Gerar o migration
npx prisma migrate dev --name add_etapas_producao

# 3. Gerar o client
npx prisma generate

# 4. (opcional) Aplicar em produção
npx prisma migrate deploy
```

---

## 10. Riscos e Atenção

1. **Coluna `duracao_seg` em `historico_fases`** — É uma generated column. O comando `prisma db push` pode falhar ao tentar alterar essa tabela. Use `prisma migrate dev` em vez de `db push`.
2. **onDelete: Cascade** — Quando um orçamento for deletado, as etapas associadas serão deletadas automaticamente. Comportamento desejado.
3. **Unique constraint** — `@@unique([orcamentoId, etapa])` garante que não haja duplicatas. Se o seed rodar duas vezes, pode dar conflito. O seed deve usar `upsert` ou verificar existência antes de inserir.
4. **Índice** — `@@index([orcamentoId])` é redundante com o unique constraint (que já cria índice), mas explícito para clareza e para consultas que não usam etapa.
