# 2. As 12 Etapas do Padrão Umarizal

## Mapeamento Fase → Etapas

| # | Etapa | Fase | Responsável | Status no App | Ação no App |
|---|-------|------|-------------|---------------|-------------|
| 1 | **Coleta** | F1 — Coleta e Preparo | Motorista | Coletado / Pendente | Câmera + assinatura digital |
| 2 | **Documentação** | F1 — Coleta e Preparo | Expedição | OK / Pendente | **Câmera + vínculo dos itens** |
| 3 | **Aspiração** | F1 — Coleta e Preparo | Expedição | OK / Pendente | Botão Confirmar |
| 4 | **Lavagem** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente | Botão Iniciar/Concluir |
| 5 | **Higienização** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente | Botão Concluir |
| 6 | **Centrifugação** | F2 — Lavagem e Higienização | Lavagem | OK / Pendente | Botão Concluir |
| 7 | **Estendagem (sol)** | F3 — Secagem e Escovação | Secagem | OK / Pendente | Botão Iniciar/Concluir |
| 8 | **Estufas** | F3 — Secagem e Escovação | Secagem | OK / Pendente | Botão Concluir |
| 9 | **Escovação** | F3 — Secagem e Escovação | Secagem | OK / Pendente | Botão Concluir |
| 10 | **Inspeção Final** | F4 — Finalização e Entrega | Expedição | OK / Pendente | Checklist de inspeção |
| 11 | **Embalagem** | F4 — Finalização e Entrega | Expedição | OK / Pendente | Botão + foto opcional |
| 12 | **Devolução** | F4 — Finalização e Entrega | Motorista | Entregue / Pendente | Assinatura digital |

## Detalhamento: Etapa 2 — Documentação de Entrada

### Funcionalidade

Substitui a página `/admin/fase1/documentacao/` do painel admin web. Permite que a equipe de expedição registre fotos do estado inicial de cada item do orçamento, vinculando cada foto ao respectivo tapete/serviço.

### Fluxo no App

```
1. Orçamento chega em F1_COLETADO (coletado pelo motorista)
          ↓
2. App mostra lista de orçamentos aguardando documentação
          ↓
3. Usuário seleciona um orçamento
          ↓
4. App exibe os itens (tapetes) do orçamento
          ↓
5. Para cada item, usuário pode:
   ├── Tirar foto(s) via câmera
   ├── Visualizar fotos já tiradas
   └── Remover foto (se errou)
          ↓
6. Usuário confirma "Documentação Concluída"
          ↓
7. Backend: Salva fotos + Avança etapa 2 para "concluida"
          ↓
8. Se etapa 3 (Aspiração) também foi concluída → fase avança para F1_DOCUMENTACAO
```

### Regras de Vínculo

- Cada foto é vinculada a um **item específico** do orçamento via `itemId`
- Um item pode ter múltiplas fotos (ilimitado)
- Itens sem foto também podem prosseguir (campo opcional)
- As fotos ficam visíveis no Portal do Cliente agrupadas por item

### Endpoints Utilizados (já existentes no backend)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/api/orcamentos?status=COLETADO` | Listar orçamentos para documentar |
| `GET` | `/api/orcamentos/:id` | Detalhes do orçamento + itens |
| `POST` | `/api/orcamentos/:id/fotos` | Upload de fotos com `itemId` |
| `GET` | `/api/orcamentos/:id/fotos` | Listar fotos existentes |
| `DELETE` | `/api/orcamentos/:id/fotos/:indice` | Remover foto |
| `PATCH` | `/api/orcamentos/:id/status` | Avançar para próxima etapa |

### Visibilidade

- **Expedição e Admin:** Podem tirar, ver e remover fotos
- **Demais perfis:** Podem apenas visualizar as fotos já tiradas
- **Preços:** NUNCA aparecem valores nesta tela (nem para expedição)

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
| Etapa 2 (Documentação) | Permanece em `F1_COLETADO` (aguarda Aspiração) |
| Etapa 3 (Aspiração) | Avança `faseAtual` para `F1_DOCUMENTACAO` |
| Etapa 4 (Lavagem) | Avança `faseAtual` para `F2_F3_PRODUCAO` |
| Etapa 7 (Estendagem) | Avança `faseAtual` para `SECAGEM` |
| Etapa 10 (Inspeção) | Avança `faseAtual` para `F4_DEVOLUCAO` |
| Etapa 12 (Devolução) | Avança `faseAtual` para `ENTREGUE` |
