# 7. Almoxarifado — Substituição da Planilha

## 7.1 Funcionalidade

Substitui a planilha manual de controle de entrada/saída de tapetes.

### Dados da Planilha Atual

| Coluna | Origem no Backend |
|--------|-------------------|
| ✅ Flag (caneta) = carregado no veículo | Nova: `carregamento_veiculo` |
| Data da coleta | `orcamento.dataColetaAgendada` |
| Nome do cliente | `orcamento.cliente.nome` |
| Código | `orcamento.codigo` (ORC-XXXX) |
| Tipo (tapete/enxoval/outros) | `orcamento.itens[].servico.categoria` |
| Descrição do serviço | `orcamento.itens[].servico.nome` |
| Cor (opcional) | `orcamento.itens[].adicionais` ou observações |
| Quantidade/Tamanho | `orcamento.itens[].largura x comprimento` |
| Data de devolução | `orcamento.dataEntregaAgendada` |
| Assinatura de entrega | Nova: assinatura digital no app |

### 7.2 Tela "Almoxarifado/Estoque"

```
┌──────────────────────────────────────────────┐
│ 🔍 Buscar tapete...                          │
├──────────────────────────────────────────────┤
│ 📦 Coletados (5)                             │
│                                              │
│ 🔲 ORC-20260730-0001 — Maria Silva           │
│    2.10 x 2.90m | Tapete Persa              │
│    Coleta: 30/07 | Prev entrega: 10/08      │
│                                              │
│ 🔲 ORC-20260730-0002 — João Souza (CARREGAR)│
│    1.50 x 2.00m | Tapete Sintético          │
│    Coleta: 30/07 | Prev entrega: 05/08      │
│                                              │
│ ✅ ORC-20260729-0003 — Ana Beatriz           │
│    ✓ Carregado em 30/07 às 14:30            │
│                                              │
├──────────────────────────────────────────────┤
│ 🚚 Entregues Hoje (2)                        │
│ ✅ ORC-20260728-0004 — Carlos Lima           │
│    Entregue em 30/07 às 16:45               │
│    Assinatura: [ver]                         │
└──────────────────────────────────────────────┘
```

### 7.3 Ações

- **🔲 → ✅** Toque no checkbox: marca como "Carregado no veículo"
- **✅ → 🔲** Toque novamente: desmarca (se ainda não foi entregue)
- Ao marcar como **Entregue**: abre assinatura digital
- Ao marcar como **Coletado**: abre câmera para foto

### 7.4 Filtros

- Por status: Coletado | Carregado | Entregue
- Por período: Hoje | Esta semana | Este mês
- Por tipo: Tapete | Enxoval | Outros
- Busca textual: nome, código, endereço
