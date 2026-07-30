# 2. As 12 Etapas do Padrão Umarizal

## Mapeamento Fase → Etapas

| # | Etapa | Fase | Responsável | Status no App |
|---|-------|------|-------------|---------------|
| 1 | **Coleta** | F1 — Coleta e Preparo | Motorista | Coletado / Pendente |
| 2 | **Documentação** | F1 — Coleta e Preparo | Expedição | OK / Pendente |
| 3 | **Aspiração** | F1 — Coleta e Preparo | Expedição | OK / Pendente |
| 4 | **Lavagem** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente |
| 5 | **Higienização** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente |
| 6 | **Centrifugação** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente |
| 7 | **Estendagem (sol)** | F3 — Secagem e Escovação | Secagem | OK / Pendente |
| 8 | **Estufas** | F3 — Secagem e Escovação | Secagem | OK / Pendente |
| 9 | **Escovação** | F3 — Secagem e Escovação | Secagem | OK / Pendente |
| 10 | **Inspeção Final** | F4 — Finalização e Entrega | Expedição | OK / Pendente |
| 11 | **Embalagem** | F4 — Finalização e Entrega | Expedição | OK / Pendente |
| 12 | **Devolução** | F4 — Finalização e Entrega | Motorista | Entregue / Pendente |

## Fluxo no Backend

O backend atual gerencia **fases** (F0 a F4 + SECAGEM). O app precisará de um desdobramento maior dentro da fase `F2_F3_PRODUCAO` (que hoje é uma única fase) para controlar as etapas 4 a 9 individualmente.

### Proposta de implementação

**Opção A — Tabela `etapas_producao` (recomendada)**

Criar nova tabela no banco:

```sql
CREATE TABLE etapas_producao (
  id SERIAL PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id),
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 12),
  status VARCHAR(20) DEFAULT 'pendente',
  responsavel VARCHAR(100),
  concluido_em TIMESTAMP,
  observacoes TEXT,
  UNIQUE(orcamento_id, etapa)
);
```

**Opção B — Reutilizar `evento_producao`**

Usar a tabela `evento_producao` existente, criando eventos para cada etapa:

```typescript
// Exemplo de eventos para cada etapa
{ tipo: "COLETA", etapa: 1, descricao: "Coleta realizada" }
{ tipo: "DOCUMENTACAO", etapa: 2, descricao: "Documentação registrada" }
{ tipo: "ASPIRACAO", etapa: 3, descricao: "Aspiração concluída" }
{ tipo: "LAVAGEM", etapa: 4, descricao: "Lavagem iniciada" }
// ...
{ tipo: "DEVOLUCAO", etapa: 12, descricao: "Devolução realizada" }
```

**Recomendação:** Opção A — tabela dedicada, mais simples de consultar e manipular pelo app.

## Sincronização com o Sistema de Fases Existente

O app não substitui o sistema de fases — ele se integra a ele:

| Quando o app conclui | O backend faz |
|----------------------|---------------|
| Etapa 1 (Coleta) | Avança `faseAtual` para `F1_COLETADO` |
| Etapa 3 (Aspiração) | Avança `faseAtual` para `F1_DOCUMENTACAO` |
| Etapa 4 (Lavagem) | Avança `faseAtual` para `F2_F3_PRODUCAO` |
| Etapa 9 (Escovação) | Avança `faseAtual` para `SECAGEM` |
| Etapa 10 (Inspeção) | Avança `faseAtual` para `F4_DEVOLUCAO` |
| Etapa 12 (Devolução) | Avança `faseAtual` para `ENTREGUE` |
