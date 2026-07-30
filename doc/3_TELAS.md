# 3. Telas do Aplicativo

## 3.1 Login

- Campo: Usuário (CPF ou email)
- Campo: Senha
- Botão: Entrar
- **Sem "Esqueci senha"** — admin define a senha
- Após login bem-sucedido: token salvo no AsyncStorage
- **Próxima abertura:** pula direto para o Dashboard (sem login)

## 3.2 Dashboard (Home)

Cards por perfil:

### Motorista
- 🚚 **Minha Rota de Hoje** → Rota do dia (RouteXL)
- 📦 **Coletas Pendentes** → Lista de coletas do dia
- 📦 **Entregas Pendentes** → Lista de entregas do dia
- ✅ **Finalizados Hoje** → Resumo do dia

### Lavagem (F2)
- 🧼 **Na Fila de Lavagem** → Tapetes aguardando lavagem
- 🧼 **Lavando Agora** → Tapetes em processo
- ✅ **Finalizados Hoje**

### Secagem (F3)
- ☀️ **Na Fila de Secagem**
- ☀️ **Secando Agora**
- ✅ **Finalizados Hoje**

### Expedição (F4)
- 📋 **Inspeção Pendente**
- 📦 **Embalagem Pendente**
- ✅ **Finalizados Hoje**

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

## 3.4 Kanban por Fase

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
- Serviço + medidas
- Status da etapa atual
- Tempo em cada etapa

## 3.5 Detalhes do Tapete

- 📸 Fotos do estado inicial (coleta)
- 📋 Informações: cliente, endereço, itens, medidas, cor
- 📊 Timeline: linha do tempo com as 12 etapas
- 📍 Status atual: qual etapa está agora
- Botão: Avançar para próxima etapa (com confirmação)

## 3.6 Almoxarifado/Estoque (Flag de Carregamento)

Substitui a caneta na planilha. Cada orçamento tem um toggle:

```
🔲 Tapete A — ORC-20260730-0001 [Carregar no veículo]
🔲 Tapete B — ORC-20260730-0002 [Carregar no veículo]
✅ Tapete C — ORC-20260730-0003 ✓ Carregado
```

Quando marcado como "Carregado", aparece na lista de "Pronto para entrega".
Essa flag ajuda a localizar o tapete no estoque antes de carregar.

## 3.7 Relatório do Dia

- Total de coletas
- Total de entregas
- Total por tipo de serviço
- Tempo médio por etapa
- Botão: Compartilhar resumo
