# 🧩 Catálogo de Módulos e Feature Flags — umarizal.app

> **Agente:** FeatureCatalogGPT — Catálogo Modular e Flags (Fase 5, #25)
> **Status:** ✅ Catálogo elaborado em 2026-08-10

## 📦 Módulos do app (implementados)

| Módulo | Telas/Componentes | Endpoints backend | Perfis |
|--------|-------------------|-------------------|--------|
| **Auth** | `Login` | `/auth/login` (B4) | Todos |
| **Dashboard** | `Dashboard` | `/kanban/:perfil` (B18) | Todos |
| **Kanban** | `KanbanProducao`, `KanbanCard`, `StatusBadge` | `/kanban/:perfil` | Todos |
| **Detalhes** | `DetalhesOrcamento`, `EtapaTimeline` | `/etapas/:orcamentoId` (B8) | Todos |
| **Rota do Dia** | `RotaDoDia`, `MapaRota` | `/routexl/*` (B22/B23), eventos | Motorista |
| **Coleta** | `CameraCapture`, `SignaturePad` | `/orcamentos/:id/coleta-realizada` (B9) | Motorista |
| **Entrega** | `SignaturePad` | `/orcamentos/:id/entrega-realizada` (B10) | Motorista |
| **Produção** | `Producao` | `/etapas/:id/iniciar|concluir|retornar` (B5–B7) | Lavagem/Secagem |
| **Almoxarifado** | `Almoxarifado` | `/orcamentos/almoxarifado`, `/:id/carregar` (B11/B12) | Motorista/Expedição |
| **Documentação** | `Documentacao`, `DocumentacaoOrcamento` | `/orcamentos/documentacao-pendente` (B21), `/fotos` | Expedição |
| **Inspeção/Embalagem** | `InspecaoChecklist` | `/etapas/:id/concluir` | Expedição |
| **Relatório** | `RelatorioDia` | `/relatorio/*` | Admin (+demais sem valores) |
| **Preços** | `Preco` | — (filtro no client) | Somente admin (F36/B20) |

## 🚩 Feature Flags

| Flag | Estado atual | Quando ativar |
|------|--------------|---------------|
| `notificacoes.push` (F30.1) | OFF | Sprint futura — após Q1–Q4 estabilizar |
| `offline.modo` (cache da rota) | OFF | Avaliar após Q1 (feedback do motorista) |
| `aviso.privacidade` | OFF (doc pronto) | Exibir no painel admin (P1 do backlog) |
| `api.url.dinamica` (EXPO_PUBLIC_API_URL) | OFF | Com R-4 (P2 do backlog) |

## 🔒 Regras transversais

- **Valores financeiros**: visíveis apenas se `perfis.includes('admin')` (componente `Preco`)
- **Perfis**: `requirePerfil(...)` no backend — admin sempre passa (B15)
- **Rotas de 1 segmento** (`/minhas-coletas`, `/almoxarifado`, `/documentacao-pendente`) registradas antes de `GET /:id`

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · FeatureCatalogGPT — catálogo modular -->
