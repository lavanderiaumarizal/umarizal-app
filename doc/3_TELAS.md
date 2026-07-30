# 3. Telas do Aplicativo

## 3.1 Login

- Campo: Usuário (CPF ou email)
- Campo: Senha
- Botão: Entrar
- **Sem "Esqueci senha"** — admin define a senha
- Após login bem-sucedido: token salvo no SecureStore (Keychain)
- **Próxima abertura:** pula direto para o Dashboard (sem login)

## 3.2 Dashboard (Home)

Cards por perfil — cada card mostra apenas a contagem de itens pendentes.

### Motorista
- 🚚 **Minha Rota de Hoje** → Rota do dia (RouteXL)
- 📦 **Coletas Pendentes** → Lista de coletas do dia
- 📦 **Entregas Pendentes** → Lista de entregas do dia
- ✅ **Finalizados Hoje** → Resumo do dia

### Lavagem (F2)
- 🧼 **Na Fila de Lavagem** → Tapetes aguardando lavagem
- 🧼 **Lavando Agora** → Tapetes em processo
- ✅ **Finalizados Hoje**
- ⚠️ **Sem preços** — valores NUNCA são exibidos

### Secagem (F3)
- ☀️ **Na Fila de Secagem**
- ☀️ **Secando Agora**
- ✅ **Finalizados Hoje**
- ⚠️ **Sem preços** — valores NUNCA são exibidos

### Expedição (F4)
- 📋 **Documentação Pendente** (Etapa 2) → captura de fotos
- 🔄 **Aspiração Pendente** (Etapa 3)
- 📋 **Inspeção Pendente** (Etapa 10)
- 📦 **Embalagem Pendente** (Etapa 11)
- ✅ **Finalizados Hoje**

### Admin
- 📊 **Resumo Geral** — Todos os indicadores
- 💰 **Financeiro** — Valores, pagamentos, PIX (visível apenas para admin)
- 👥 **Todos os perfis** — Pode alternar entre visões

## 3.3 Rota do Dia (Motorista)

- Lista de paradas ordenadas (RouteXL)
- Cada parada mostra:
  - Ordem
  - Nome do cliente
  - Endereço
  - Tipo (Coleta/Entrega)
  - Horário estimado
  - Status (pendente → coletado/entregue)
- Ações:
  - ✅ **Coletar** → abre câmera para foto + assinatura
  - ✅ **Entregar** → abre assinatura digital do cliente
  - 📍 **Ver no mapa** → link para Google Maps

## 3.4 Documentação de Entrada (Expedição — Etapa 2)

**Funcionalidade:** Substitui a página `/admin/fase1/documentacao/` do painel admin. A equipe de expedição tira fotos do estado inicial do tapete e vincula cada foto ao respectivo item do orçamento.

### Fluxo da Tela

```
┌─────────────────────────────────────┐
│ 📸 Documentação de Entrada          │
│                                     │
│ ORC-20260730-0001 — Maria Silva     │
│ Coleta: 30/07/2026                  │
│                                     │
│ ┌── Itens do Tapete ──────────────┐ │
│ │ 📷 Tapete Persa 2.10 x 2.90m   │ │
│ │    [📸 3 fotos] [+ Adicionar]  │ │
│ ├─────────────────────────────────┤ │
│ │ 📷 Tapete Sintético 1.50 x 2.00│ │
│ │    [📸 2 fotos] [+ Adicionar]  │ │
│ ├─────────────────────────────────┤ │
│ │ 📷 Tapete Marroquino 1.90 x 1.00│ │
│ │    [📸 0 fotos] [+ Adicionar]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✅ Confirmar Documentação]         │
└─────────────────────────────────────┘
```

### Ações

1. **Selecionar orçamento**: Lista de orçamentos em F1_COLETADO (coletados, aguardando documentação)
2. **Visualizar itens**: Mostra todos os itens do orçamento com nome, medidas e quantidade de fotos já tiradas
3. **Tirar foto**: Abre a câmera (expo-camera), permite múltiplas fotos por item
4. **Vincular ao item**: Cada foto é vinculada ao `itemId` do orçamento (OrcamentoItem.id)
5. **Preview**: Miniaturas das fotos já tiradas por item
6. **Remover foto**: Deslizar para deletar uma foto
7. **Confirmar**: Avança a etapa 2 (Documentação) e registra no backend

### Backend (já existe)

- `POST /api/orcamentos/:id/fotos` — Upload com `itemId` opcional
- `GET /api/orcamentos/:id/fotos` — Listar fotos com itemId
- `GET /api/orcamentos/:id` — Dados do orçamento (sem valores financeiros para não-admin)

### Regras de Visibilidade

- **Expedição e Admin**: Acesso completo à documentação
- **Demais perfis**: Acesso apenas para visualização (não podem editar fotos)
- **Preços**: NUNCA aparecem valores na tela de documentação

## 3.5 Kanban por Fase

Visualização em colunas estilo Trello:

```
Pendente | Em Andamento | Concluído
---------|--------------|----------
Tapete A | Tapete B     | Tapete C
Tapete D |              | Tapete E
```

Cada card mostra:
- Código ORC-XXXX
- Nome do cliente
- Serviço + medidas (sem valores!)
- Status da etapa atual
- Tempo em cada etapa

## 3.6 Detalhes do Tapete

Conteúdo varia conforme o perfil:

| Seção | Admin | Motorista | Lavagem | Secagem | Expedição |
|-------|-------|-----------|---------|---------|-----------|
| 📸 Fotos do estado inicial | ✅ | ✅ | ✅ | ✅ | ✅ |
| 👤 Nome + telefone do cliente | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🏠 Endereço completo | ✅ | ✅ | ✅ | ❌ | ❌ |
| 📋 Itens, medidas, cor | ✅ | ✅ | ✅ | ✅ | ✅ |
| 💰 **Valores e pagamento** | **✅** | **❌** | **❌** | **❌** | **❌** |
| 🔒 CPF/CNPJ/e-mail | ✅ | ❌ | ❌ | ❌ | ❌ |
| 📊 Timeline das 12 etapas | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📍 Status atual | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔄 Avançar/retornar etapa | ✅ | ✅ (etapas 1,12) | ✅ (4-6) | ✅ (7-9) | ✅ (2,3,10,11) |

## 3.7 Almoxarifado/Estoque (Flag de Carregamento)

Substitui a caneta na planilha. Cada orçamento tem um toggle:

```
🔲 Tapete A — ORC-20260730-0001 [Carregar no veículo]
🔲 Tapete B — ORC-20260730-0002 [Carregar no veículo]
✅ Tapete C — ORC-20260730-0003 ✓ Carregado
```

Quando marcado como "Carregado", aparece na lista de "Pronto para entrega".
Essa flag ajuda a localizar o tapete no estoque antes de carregar.

## 3.8 Relatório do Dia

- Total de coletas
- Total de entregas
- Total por tipo de serviço
- Tempo médio por etapa
- Botão: Compartilhar resumo
- **Admin vê:** valores financeiros no relatório
- **Demais perfis:** relatório sem valores
