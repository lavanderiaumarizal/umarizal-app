# 🧩 Diagramas — umarizal.app

> **Agente:** UMLArchitectGPT — Diagramas de classes e sequência (Fase 2, #10)
> **Status:** ✅ Validado — arquitetura e fluxos desenhados conforme o código real

## 🏛️ Visão Geral das Entidades (Modelo de Dados)

```mermaid
flowchart LR
    U[Usuario<br/>perfisApp: string[]] --> T[Transportador<br/>usuarioId FK]
    T --> O[Orcamento<br/>faseAtual]
    O --> E[EtapaProducao<br/>etapa 1-12 · unique orcamentoId+etapa]
    O --> C[CarregamentoVeiculo<br/>orcamentoId unique]
    O --> I[OrcamentoItem<br/>medidas]
    O --> F[Fotos<br/>itemId opcional]
```

> Diagrama corresponde ao `prisma/schema.prisma` do backend (models `Usuario`, `Transportador`, `Orcamento`, `EtapaProducao`, `CarregamentoVeiculo`, `OrcamentoItem`, `OrcamentoFoto`).

## 🔄 Sequência — Fluxo do Motorista (Rota do Dia → Coleta → Entrega)

```mermaid
sequenceDiagram
    participant App as Motorista (App)
    participant API as Backend API
    participant RX as RouteXL

    App->>API: GET /api/routexl/rota-do-dia?data=YYYY-MM-DD
    API-->>App: rota com stops + concluido (B23)

    alt Nenhuma rota salva
        App->>API: GET /api/orcamentos/logistica/calendario/eventos
        API-->>App: eventos do dia
        App->>API: POST /api/routexl/optimize
        API->>RX: optimize(stops)
        RX-->>API: tour otimizado
        API-->>App: waypoints ordenados
        App->>API: POST /api/routexl/save-route
    end

    App->>API: POST /api/orcamentos/:id/coleta-realizada<br/>(fotos + assinatura)
    API-->>App: etapa 1 concluida · faseAtual = F1_COLETADO

    Note over App: Parada desabilitada na rota (F19.1)

    App->>API: POST /api/orcamentos/:id/entrega-realizada<br/>(assinatura)
    API-->>App: etapa 12 concluida · faseAtual = ENTREGUE
```

## 🔄 Sequência — Documentação de Entrada (Expedição)

```mermaid
sequenceDiagram
    participant App as Expedição (App)
    participant API as Backend API

    App->>API: GET /api/orcamentos/documentacao-pendente
    API-->>App: orçamentos F1_COLETADO + itens com medidas

    loop Para cada item
        App->>App: Câmera (expo-camera)
        App->>API: POST /api/orcamentos/:id/fotos { fotos, itemId }
        API-->>App: fotos vinculadas ao item
    end

    App->>API: POST /api/etapas/:orcamentoId/concluir { etapa: 2 }
    API-->>App: etapa 2 concluida
```

## 🏗️ Arquitetura de Camadas (Backend)

```mermaid
flowchart TD
    R[Routes<br/>validators] --> C[Controllers]
    C --> S[Services<br/>regras de negócio]
    S --> P[Prisma Client]
    P --> DB[(PostgreSQL)]
    A[Middleware<br/>authenticate · requirePerfil · rateLimiter] --> R
```

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · UMLArchitectGPT — diagramas -->
