# 1. Arquitetura

## 1.1 Stack Tecnológico

### Frontend (App)
- **React Native + Expo** — Build local sem Google/Apple Store
- **Expo Application Services (EAS)** — Build local via `eas build --platform android --local`
- **AsyncStorage** — Sessão persistente (nunca perde login)
- **NetInfo** — Detecção de conectividade
- **React Navigation** — Navegação entre telas

### Backend (Existente)
- **API REST** — `https://api.lavanderiaumarizal.com.br`
- **Autenticação JWT** — Token com validade longa (30 dias), renovado a cada request
- **WebSockets** — Opcional para atualizações em tempo real

## 1.2 Fluxo de Autenticação

```
[App] → POST /api/auth/login (motorista) → { token, usuario }
                                              ↓
                                     AsyncStorage.setItem('token')
                                              ↓
                                  Toda request → Header Authorization
                                              ↓
                                  Se 401 → refresh token ou mantém logado
```

**Persistência:** Token salvo no AsyncStorage. Sempre que o app abre, lê o token do storage. Não há logout automático. A única forma de "deslogar" é limpando os dados do app ou reinstalando.

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
| `POST /api/auth/login-motorista` | Login específico para motoristas com token persistente |
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
