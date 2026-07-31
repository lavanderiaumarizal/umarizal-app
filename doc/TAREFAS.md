# 📋 Tarefas — umarizal.app

## Legenda de Status

| Flag | Significado |
|------|-------------|
| 🔴 **Não Iniciada** | Tarefa ainda não começou |
| 🟡 **Em Desenvolvimento** | Código sendo implementado |
| 🟢 **Em Teste** | Desenvolvimento concluído, aguardando testes |
| 🔵 **Em Homologação** | Testes aprovados, aguardando validação do usuário |
| ✅ **Concluída** | Homologada e aprovada |
| ⏸️ **Bloqueada** | Aguardando dependência de outra tarefa |

---

## Sprint 1 — Fundação (Backend + Setup do App)

**Objetivo:** Preparar o backend com as novas tabelas e endpoints, e criar o esqueleto do app com login persistente.

### Tarefas de Backend

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| B1 | **Criar tabela `etapas_producao`** | Adicionar model Prisma `EtapaProducao` com campos: orcamentoId, etapa (1-12), nome, status, responsavel, concluidoEm, observacoes. Unique(orcamentoId, etapa). [Ver detalhamento](./SPRINT1_B1_DETALHAMENTO.md) | ✅ |
| B2 | **Criar tabela `carregamento_veiculo`** | Adicionar model Prisma `CarregamentoVeiculo` com campos: orcamentoId (unique), carregadoEm, usuarioId, veiculo. [Ver detalhamento](./SPRINT1_B2_DETALHAMENTO.md) | ✅ |
| B3 | **Expandir sistema de permissões para multi-perfil** | Adicionar campo `perfisApp` (JSON array) à tabela `usuarios`. Ex: `["motorista","expedicao"]`. Manter campo `nivel` existente para compatibilidade. Admin pode ter múltiplos perfis. [Ver detalhamento](./SPRINT1_B3_DETALHAMENTO.md) | ✅ |
| B3.1 | **Criar endpoint `PATCH /api/admin/usuarios/:id/perfis`** | Endpoint admin para gerenciar perfis de um usuário. Body: `{ perfis: string[] }`. Atualiza `perfisApp` no banco. [Ver detalhamento](./SPRINT1_B3_1_DETALHAMENTO.md) | ✅ |
| B4 | **Adicionar `rememberMe` e `transportadorId` ao login** | Adaptar `POST /api/auth/login` existente: suportar `rememberMe: true` para token de 30 dias. Se perfil incluir 'motorista', retornar `transportadorId` e `veiculo`. [Ver detalhamento](./SPRINT1_B4_DETALHAMENTO.md) | ✅ |
| B5 | **Endpoint `/api/etapas/:id/iniciar` + admin com perfisApp** | `POST /api/etapas/:orcamentoId/iniciar` com body `{ etapa, responsavel }`. Cria validador, service, controller, routes. Inclui atualização do `criar.astro` e `UsuariosList.jsx` para suportar `perfisApp`. [Ver detalhamento](./SPRINT1_B5_DETALHAMENTO.md) | ✅ |
| B6 | **Criar endpoint `POST /api/etapas/:orcamentoId/concluir`** | Conclui uma etapa (status = concluida). Body: { etapa, responsavel, observacoes? }. Deve avançar a faseAtual do orçamento conforme mapeamento. Sincroniza com fases existentes | 🟡 |
| B7 | **Criar endpoint `POST /api/etapas/:orcamentoId/retornar`** | Retorna uma etapa (status = pendente). Body: { etapa, motivo }. Registra observacao | 🔴 |
| B8 | **Criar endpoint `GET /api/etapas/:orcamentoId`** | Retorna status de todas as 12 etapas para um orçamento | 🔴 |
| B9 | **Criar endpoint `POST /api/orcamentos/:id/coleta-realizada`** | Marca coleta como realizada. Body: { fotos[], assinatura, observacoes? }. Avança etapa 1 | 🔴 |
| B10 | **Criar endpoint `POST /api/orcamentos/:id/entrega-realizada`** | Marca entrega como realizada. Body: { assinatura, observacoes?, fotos[]? }. Avança etapa 12 | 🔴 |
| B11 | **Criar endpoint `POST /api/orcamentos/:id/carregar`** | Marca tapete como carregado no veículo. Body: { veiculo? }. Cria registro em carregamento_veiculo | 🔴 |
| B12 | **Criar endpoint `DELETE /api/orcamentos/:id/carregar`** | Remove flag de carregado no veículo | 🔴 |
| B13 | **Criar endpoint `GET /api/orcamentos/minhas-coletas`** | Retorna coletas atribuídas ao transportador do motorista logado | 🔴 |
| B14 | **Criar endpoint `GET /api/orcamentos/minhas-entregas`** | Retorna entregas atribuídas ao transportador do motorista logado | 🔴 |
| B15 | **Criar middleware de perfil (multi-perfil)** | Middleware `requirePerfil(...perfis)` que aceita array de perfis. Admin sempre passa. Usuário precisa ter PELO MENOS UM dos perfis exigidos. Se `req.user.perfis` incluir 'admin', libera tudo | 🔴 |
| B16 | **Seed de dados** | Criar script que inicializa as 12 etapas para orçamentos existentes com status adequado baseado no faseAtual | 🔴 |
| B17 | **Ajustar rate limiter** | Garantir que o rate limiter permita 60 req/min para o app e 10 req/min para login | 🔴 |

### Tarefas de Frontend (App)

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| F1 | **Setup do projeto Expo** | `npx create-expo-app@latest umarizal-app`. Instalar dependências: react-navigation, async-storage, axios, expo-camera, expo-location, signature-canvas, netinfo, **zustand, expo-secure-store, react-native-maps, @react-navigation/bottom-tabs** | 🔴 |
| F2 | **Estrutura de pastas** | Criar estrutura: src/api, src/components, src/screens, src/navigation, src/hooks, src/store, src/types | 🔴 |
| F3 | **Auth Store (Zustand + SecureStore)** | Implementar store com Zustand (`useAuthStore`). Token armazenado no **expo-secure-store** (Keychain). User profile no AsyncStorage. Métodos: setToken, setUser, loadStoredAuth, logout | 🔴 |
| F4 | **Axios Client com Interceptor** | Criar instância axios com baseURL, interceptors para token (lê do Zustand store) e tratamento de 401 com tentativa de refresh automático | 🔴 |
| F5 | **Tela de Login** | Campos: email, senha. Checkbox "Manter conectado" → envia `rememberMe: true`. Botão Entrar. Consumir `POST /api/auth/login`. Ao logar, salvar token + user no SecureStore/AsyncStorage | 🔴 |
| F6 | **Navegação** | React Navigation: se logado → Dashboard, se não → Login. Stack navigator | 🔴 |
| F7 | **Persistência de Login** | Ao abrir o app, chamar `useAuthStore.loadStoredAuth()`. Se token existir no SecureStore, validar com backend. Se válido, pular login. Se inválido, mostrar tela de login. **Nunca desloga a menos que usuário clique em Sair** | 🔴 |
| F7.1 | **Configurar Zustand global** | Criar `src/store/appStore.ts` com estado global: perfil ativo, preferências de tema, última rota visitada. Usar `create()` do zustand com persistência no AsyncStorage | 🔴 |
| F7.2 | **Expo SecureStore para token JWT** | Substituir AsyncStorage por `expo-secure-store` para armazenamento do token JWT. Implementar get/set/delete com SecureStore. AsyncStorage mantido apenas para dados não sensíveis (user profile) | 🔴 |

---

## Sprint 2 — Kanban e Etapas

**Objetivo:** Implementar o kanban de produção e o gerenciamento das 12 etapas.

### Tarefas de Backend

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| B18 | **Criar endpoint `GET /api/kanban/:perfil`** | Retorna orçamentos agrupados por status/fase conforme o perfil (motorista vê coletas/entregas, lavagem vê F2, etc). **Sem valores financeiros para perfis não-admin** | 🔴 |
| B19 | **Criar endpoint `PUT /api/orcamentos/:id/etapa`** | Atualiza etapa específica com status e responsavel. Alternativa mais simples aos endpoints individuais | 🔴 |
| B20 | **Criar filtro de dados por perfil** | Implementar função `filtrarDadosPorPerfil(orcamento, perfis)` que remove campos financeiros (valorTotal, pix, parcelas, etc.) e dados sensíveis (CPF, e-mail) para perfis não-admin. Aplicar em todos os endpoints de listagem/detalhes | 🔴 |
| B21 | **Criar endpoint `GET /api/orcamentos/documentacao-pendente`** | Retorna orçamentos em F1_COLETADO aguardando documentação (etapa 2). Inclui itens com medidas para vincular fotos. **Sem valores financeiros** | 🔴 |

### Tarefas de Frontend (App)

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| F8 | **Tela Dashboard** | Cards por perfil conforme documento 3_TELAS.md. Motorista: rota+coletas+entregas. Lavagem: fila lavagem. Secagem: fila secagem. Expedição: inspeção+embalagem | 🔴 |
| F9 | **Tela Kanban por Fase** | 3 colunas (Pendente | Em Andamento | Concluído). Cards com código, cliente, serviço, medidas, status, tempo. Scroll horizontal | 🔴 |
| F10 | **Tela Detalhes do Tapete** | Fotos do estado inicial, dados do cliente, itens/medidas, timeline das 12 etapas, status atual, botão Avançar/Retornar | 🔴 |
| F11 | **Componente Timeline de Etapas** | Visualização vertical das 12 etapas com ícones, check verde para concluída, azul para atual, cinza para pendente | 🔴 |
| F12 | **Componente KanbanCard** | Card reutilizável com código, nome, serviço, medidas, badge de status, tempo decorrido | 🔴 |
| F13 | **Componente StatusBadge** | Badge de cor para cada status (pendente=cinza, andamento=azul, concluido=verde) | 🔴 |

---

## Sprint 3 — Motorista (Rota do Dia + Coleta/Entrega + Flip)

**Objetivo:** Implementar o fluxo completo do motorista: seleção de data, geração de rota (RouteXL), flip, salvamento, visualização em mapa, coleta com foto, entrega com assinatura e desabilitação automática de paradas concluídas.

### Tarefas de Backend

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| B22 | **Criar rotas RouteXL para motorista** | Criar `routexl.motorista.routes.ts` ou adaptar middleware existente para aceitar perfil motorista nos endpoints de rota (optimize, save-route, rota-do-dia, geocode). **Não** permitir `enviar-confirmacoes` para motorista | 🔴 |
| B23 | **Adicionar status de conclusão nos waypoints** | Ao retornar a rota via `GET /api/routexl/rota-do-dia`, incluir campo `concluido: boolean` em cada waypoint baseado no `faseAtual` do orçamento. Se orçamento estiver em F1_COLETADO ou ENTREGUE, waypoint = concluído | 🔴 |

### Tarefas de Frontend (App)

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| F14 | **Tela Rota do Dia** | Seletor de data (calendário). Carregar rota do RouteXL. Se não existir rota salva, mostrar mensagem "Nenhuma rota para esta data" com botão "Gerar Rota". Lista de paradas ordenadas: ordem, cliente, endereço, tipo, horário, status. Botões Coletar/Entregar + Maps por parada. Paradas concluídas aparecem desabilitadas (check verde, botões ocultos) | 🔴 |
| F14.1 | **Mapa da Rota (react-native-maps)** | Adicionar mapa na tela Rota do Dia mostrando todas as paradas como pins. Cores diferentes para coleta (🟢) e entrega (🔵). Linha conectando as paradas na ordem da rota. Ao tocar no pin, mostrar nome + endereço + botão navegar | 🔴 |
| F14.2 | **Gerar Rota (RouteXL)** | Botão "🔄 Gerar Rota" que busca eventos do dia via `/api/orcamentos/logistica/calendario/eventos` e chama `POST /api/routexl/optimize` com os stops. Exibir resultado otimizado. Tratar erros (limite RouteXL, sem eventos, etc.) | 🔴 |
| F14.3 | **Flip (Inverter Ordem)** | Botão "🔄 Flip" que inverte a ordem das paradas (excluindo depot/retorno). Chama `POST /api/routexl/optimize` com `skipOptimisation: true`. O mesmo comportamento exato do `handleFlip` no `OtimizarRotaModal.jsx` do admin | 🔴 |
| F14.4 | **Salvar Rota** | Botão "💾 Salvar Rota" que persiste a rota via `POST /api/routexl/save-route`. Após salvar, a rota fica disponível para recarregamento posterior | 🔴 |
| F15 | **Fluxo de Coleta** | Ao clicar "Coletar": abrir câmera (expo-camera) para foto(s) do tapete + assinatura digital. Enviar para `POST /api/orcamentos/:id/coleta-realizada`. Após sucesso, parada desabilitada na rota | 🔴 |
| F16 | **Fluxo de Entrega** | Ao clicar "Entregar": abrir assinatura digital para o cliente assinar. Enviar para `POST /api/orcamentos/:id/entrega-realizada`. Após sucesso, parada desabilitada na rota | 🔴 |
| F17 | **Componente SignaturePad** | Tela de assinatura digital com canvas. Botão Limpar e Confirmar. Salvar como base64 | 🔴 |
| F18 | **Componente PhotoCapture** | Câmera para fotos do tapete. Múltiplas fotos. Preview antes de enviar. Usar expo-camera | 🔴 |
| F19 | **Integração com Google Maps** | Botão "📍 Maps" que abre Google Maps com endereço destino via deep link (`comgooglemaps://?daddr=lat,lng` ou `https://maps.google.com/?daddr=endereco`). Fallback para navegador se Google Maps não estiver instalado | 🔴 |
| F19.1 | **Desabilitação automática de paradas** | Após coleta ou entrega bem-sucedida, atualizar o estado local da lista para marcar a parada como concluída. Ao recarregar a rota, o backend já retorna `concluido: true` nos waypoints já finalizados | 🔴 |

---

## Sprint 4 — Lavagem e Secagem (F2 + F3)

**Objetivo:** Implementar o fluxo de produção (etapas 4 a 9).

### Tarefas de Frontend (App)

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| F20 | **Fila de Lavagem** | Tela com lista de tapetes aguardando lavagem (etapa 3 concluída, etapa 4 pendente). Botão "Iniciar Lavagem" | 🔴 |
| F21 | **Lavando Agora** | Lista de tapetes em lavagem (etapa 4 em_andamento). Botão "Concluir Lavagem" que avança para etapa 5 | 🔴 |
| F22 | **Fila de Secagem** | Lista de tapetes aguardando secagem (etapa 6 concluída, etapa 7 pendente). Botão "Iniciar Secagem" | 🔴 |
| F23 | **Secando Agora** | Lista de tapetes em secagem (etapa 7 em_andamento). Botão "Concluir Secagem" que avança para etapa 8, depois 9 | 🔴 |
| F24 | **Observações por Etapa** | Campo opcional de observações ao concluir/avançar cada etapa. Ex: "Tapete com mancha persistente", "Franja desfiada" | 🔴 |
| F25 | **Fotos de Produção** | Câmera opcional ao concluir etapas de produção. Ex: foto do tapete lavado, foto do tapete seco | 🔴 |

---

## Sprint 5 — Expedição, Documentação e Finalização (Almoxarifado + Devolução)

**Objetivo:** Implementar o almoxarifado (substituição da planilha), documentação de entrada com fotos, inspeção, embalagem e relatório.

### Tarefas de Frontend (App)

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| F26 | **Tela Almoxarifado/Estoque** | Substitui a planilha manual. Lista de tapetes com checkbox de carregamento. Filtros: status (coletado/carregado/entregue), período, tipo. Busca textual. **Sem preços** | 🔴 |
| F27 | **Flag de Carregamento** | Checkbox ao lado de cada tapete. Marcou = carregado no veículo. Desmarcou = remove flag. Consome POST/DELETE /api/orcamentos/:id/carregar | 🔴 |
| F28 | **Inspeção Final** | Checklist de inspeção: franjas, bordas, superfície, odores. Cada item OK/NOK. Só libera se todos OK. Avança etapa 10 | 🔴 |
| F29 | **Embalagem** | Botão "Embalar" que avança etapa 11. Opção de foto do tapete embalado | 🔴 |
| F30 | **Tela Relatório do Dia** | Totais: coletas, entregas, por tipo de serviço, tempo médio por etapa. Botão Compartilhar resumo (texto ou PDF). **Admin vê valores; demais perfis veem apenas quantidades** | 🔴 |
| F30.1 | **Notificações Push (opcional)** | Configurar `expo-notifications` para enviar notificações ao motorista quando uma nova rota for gerada, ou à equipe quando um tapete entrar na fila. Pode ser implementado em sprint futura | 🔴 |
| **F31** | **Tela Documentação de Entrada** | Lista de orçamentos em F1_COLETADO aguardando documentação. Mostra código, cliente, data da coleta. Toque abre detalhes dos itens para fotografar | 🔴 |
| **F32** | **Tela Captura por Item** | Ao selecionar um orçamento, mostra lista de itens (tapetes) com nome, medidas. Cada item tem botão [+] para abrir câmera. Miniaturas das fotos já tiradas por item | 🔴 |
| **F33** | **Vínculo Foto-Item** | Ao tirar foto via expo-camera, vincula ao `itemId` do OrcamentoItem. Envia para `POST /api/orcamentos/:id/fotos` com `{ fotos: [...], itemId }`. Preview das fotos enviadas | 🔴 |
| **F34** | **Remoção de Foto** | Deslizar ou botão X na miniatura para remover foto. Consome `DELETE /api/orcamentos/:id/fotos/:indice` | 🔴 |
| **F35** | **Confirmar Documentação** | Botão "Documentação Concluída" que avança etapa 2. Consome endpoint de conclusão de etapa. Notifica backend para atualizar status | 🔴 |
| **F36** | **Filtro de preços por perfil** | Implementar lógica de ocultação de valores em TODAS as telas do app. O Zustand store contém `perfis: string[]`. Componentes de valor só renderizam se `perfis.includes('admin')`. Criar componente `<Preco value={x} />` que só exibe se admin | 🔴 |

---

## Sprint 6 — Testes, Ajustes e Build

**Objetivo:** Testar com equipe real, ajustar UX e gerar APK final.

### Tarefas

| # | Tarefa | Descrição | Status |
|---|--------|-----------|--------|
| Q1 | **Teste com Motoristas** | Instalar APK no celular do motorista. Validar fluxo de coleta e entrega. Ajustar bugs | 🔴 |
| Q2 | **Teste com Lavagem** | Validar kanban de lavagem, avanço de etapas. Ajustar UX | 🔴 |
| Q3 | **Teste com Secagem** | Validar kanban de secagem, avanço de etapas. Ajustar UX | 🔴 |
| Q4 | **Teste com Expedição** | Validar almoxarifado, inspeção, embalagem. Ajustar UX | 🔴 |
| Q5 | **Ajustes de UX/UI** | Com base no feedback, ajustar cores, fontes, botões, navegação | 🔴 |
| Q6 | **Build APK Final** | `npx eas build --platform android --local --profile preview`. Gerar APK assinado | 🔴 |
| Q7 | **Distribuição** | Compartilhar APK via WhatsApp com instruções de instalação | 🔴 |
| Q8 | **Documentação de Uso** | Criar manual simples com prints das telas e fluxos | 🔴 |

---

## Resumo por Sprint

| Sprint | Tarefas Backend | Tarefas Frontend | Total |
|--------|-----------------|------------------|-------|
| **1 — Fundação** | 17 (B1-B17) + 2 (B3.1) | 10 (F1-F7.2) | **29** |
| **2 — Kanban/Etapas** | 4 (B18-B21) | 6 (F8-F13) | **10** |
| **3 — Motorista** | 2 (B22-B23) | 11 (F14-F19.1) | **13** |
| **4 — Lavagem/Secagem** | 0 | 6 (F20-F25) | **6** |
| **5 — Expedição** | 0 | 12 (F26-F36) | **12** |
| **6 — Testes/Build** | 0 | 8 (Q1-Q8) | **8** |
| **Total** | **25** | **53** | **78** |

---

## Dependências entre tarefas

```
B1 → B2 → B3 → B3.1 → B4 (cadeia de backend)
B5 → B6 → B7 → B8 (cadeia de endpoints de etapas)
B1 + B5..B8 → B16 (seed depende das tabelas e endpoints)
B4 + B15 + B20 → F36 (filtro de precos depende do backend)
B4 → F5 (login depende do endpoint)
F5 → F6 → F7 (navegação depende do login)
F8 → F9 → F10 (telas dependem do dashboard)
B22 + B23 → F14 (rotas motorista dependem do backend)
F14 → F14.2 → F14.3 → F14.4 (gerar → flip → salvar)
F14 → F15 → F16 (rota → coleta → entrega)
F15 + F16 → F19.1 (desabilitacao automatica)
F31..F35 → B21 (documentacao depende do endpoint)
F14..F19 → F30 (relatório depende das ações)
F26 → F27 (almoxarifado depende da flag)
F20..F36 → Q1..Q4 (testes dependem das telas)
```

---

## Instruções de Uso

1. Comece pelas tarefas **B1 a B4** (backend fundamental)
2. Paralelamente, inicie **F1 a F4** (setup do app)
3. Complete o backend antes de começar o frontend que depende dele
4. A cada tarefa concluída, atualize o status de 🔴 para 🟡 e depois 🟢
5. Após testar, atualize para 🔵 (homologação)
6. Somente após o usuário validar, atualize para ✅
7. Só inicie a próxima tarefa quando a anterior estiver ✅
