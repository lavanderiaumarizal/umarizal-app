# 1. Arquitetura

## 1.1 Stack Tecnológico

### Frontend (App)
- **React Native + Expo** — Build local sem Google/Apple Store
- **Expo Application Services (EAS)** — Build local via `eas build --platform android --local`
- **AsyncStorage** — Sessão persistente (nunca perde login)
  - *Recomendação extra:* **MMKV** (`react-native-mmkv`) para melhor performance em leituras frequentes (substituto mais rápido do AsyncStorage)
- **Gerenciamento de Estado Global:** **Zustand** — leve, tipado, sem boilerplate. Alternativa: Redux Toolkit
- **NetInfo** — Detecção de conectividade
- **React Navigation** — Navegação entre telas (Stack + Bottom Tabs)
- **Axios** — Requisições HTTP com interceptors
- **Expo Location** — GPS para motorista
- **React Native Maps** — Visualização da rota do dia no mapa
- **Expo Camera** — Captura de fotos na coleta e produção
- **react-native-signature-canvas** — Assinatura digital na coleta/entrega
- **Push Notifications (opcional)** — Notificar motoristas sobre nova rota ou equipe sobre mudança de status

### Segurança de Armazenamento
- **AsyncStorage** para dados não sensíveis (preferências de tema, última rota visitada)
- **react-native-keychain** (ou `expo-secure-store`) para **token JWT** — armazena no keystore seguro do dispositivo (iOS Keychain / Android EncryptedSharedPreferences)
- **HTTPS obrigatório** em toda comunicação app ↔ backend

### Backend (Existente)
- **API REST** — `https://api.lavanderiaumarizal.com.br`
- **Autenticação JWT** — Token com validade longa (30 dias), renovado a cada request bem-sucedido
- **Refresh Token** — Opcional para renovação silenciosa sem reautenticação
- **WebSockets** — Opcional para atualizações em tempo real

## 1.2 Fluxo de Autenticação

```mermaid
flowchart TD
    A[Abrir app] --> B{Existe token\nno AsyncStorage?}
    B -->|Sim| C[Validar token\ncom backend]
    C -->|Válido| D[Tela Principal\n(Dashboard por perfil)]
    C -->|Inválido/Expirado| E[Tela de Login]
    B -->|Não| E
    E --> F[Informar credenciais\nCPF ou email + senha]
    F --> G[POST /api/auth/login
{ rememberMe: true }]
    G -->|Sucesso: 200| H[Salvar token\nno Keychain/AsyncStorage]
    H --> D
    G -->|Falha: 401| E
    D --> I[Interceptor de response:\nse 401, tenta refresh automático]
    I -->|Refresh OK| D
    I -->|Refresh falha| E
```

**Persistência:**
- Ao logar pela primeira vez, o token JWT é salvo no **AsyncStorage** (e idealmente no **Keychain** para segurança extra).
- Ao abrir o app, lê o token do storage. Se existir, valida com backend → se válido, vai direto ao dashboard.
- **Não há logout automático por tempo.** A única forma de deslogar é: ação explícita do usuário (botão "Sair") ou desinstalar/limpar dados do app.
- O token tem validade de 30 dias e é renovado a cada request bem-sucedido.

## 1.3 Integração com o Backend Existente

### Endpoints a serem consumidos

| Endpoint | Uso |
|----------|-----|
| `POST /api/auth/login` | Login do motorista |
| `GET /api/auth/me` | Dados do usuário logado |
| `GET /api/orcamentos/trilha` | Pipeline por fase (kanban) |
| `GET /api/orcamentos?status=COLETADO` | Orçamentos em coleta |
| `GET /api/orcamentos/:id` | Detalhes do orçamento |
| `GET /api/orcamentos/:id/fotos` | Fotos do estado inicial |
| `POST /api/orcamentos/:id/status` | Avançar status |
| `PATCH /api/orcamentos/:id/status` | Atualizar status |
| `GET /api/routexl/rotas?data=...` | Rota do dia (RouteXL) |
| `GET /api/transportadores` | Lista de motoristas |

### Endpoints a criar no backend

| Endpoint | Descrição |
|----------|-----------|
| `POST /api/auth/login` | Login unificado com `rememberMe: true` para token de 30 dias. Retorna `perfis` e `transportadorId` |
| `POST /api/orcamentos/:id/etapa` | Avançar/substituir etapa específica (1-12) |
| `GET /api/orcamentos/minhas-coletas` | Coletas atribuídas ao motorista logado |
| `GET /api/orcamentos/minhas-entregas` | Entregas atribuídas ao motorista logado |
| `POST /api/orcamentos/:id/coletado` | Marcar como coletado (com foto + assinatura) |
| `POST /api/orcamentos/:id/entregue` | Marcar como entregue (com assinatura) |
| `GET /api/etapas/:orcamentoId` | Status de cada uma das 12 etapas |

## 1.4 Modelo de Dados (12 Etapas)

```typescript
interface Etapa {
  id: number;
  orcamentoId: string;
  etapa: number;        // 1 a 12
  nome: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  responsavel: string;  // nome do usuário que concluiu
  concluidoEm: Date;
  observacoes?: string;
}
```

Não será criada uma nova tabela — as etapas serão gerenciadas através do sistema de fases existente (historico_fases + evento_producao), com a adição de micro-etapas para F2_F3_PRODUCAO.

## 1.5 Considerações de Segurança

Baseadas na pesquisa complementar e nas melhores práticas:

| Requisito | Implementação |
|-----------|---------------|
| **Autenticação** | Todas as rotas (exceto `/login` e `/refresh`) exigem JWT no header `Authorization: Bearer <token>` |
| **Token storage** | AsyncStorage + **react-native-keychain** (keystore do dispositivo) — nunca armazenar apenas no AsyncStorage em produção |
| **Refresh token** | Opcional para renovação silenciosa sem expor o token principal por períodos excessivos |
| **HTTPS obrigatório** | Toda comunicação app ↔ backend via HTTPS. Bloquear HTTP no backend |
| **Controle de perfil** | Middleware `requirePerfil()` no backend — cada perfil só acessa seus endpoints autorizados |
| **Rate limiting** | 60 req/min por IP (app), 10 req/min (login). Backend já implementa via `rateLimiter.ts` |
| **Dados sensíveis** | Nunca logar tokens, senhas ou dados completos do cliente no console do app |
