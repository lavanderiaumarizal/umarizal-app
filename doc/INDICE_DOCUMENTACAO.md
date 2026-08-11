# 📚 Índice da Documentação — umarizal.app

> **Agente:** SOCGPT — Orquestrador da Documentação (Fase 2, #7)
> **Status:** ✅ Validado — documentação completa para o estado atual do projeto

## 🗂️ Índice Central

| # | Documento | Tipo | Descrição | Status |
|---|-----------|------|-----------|--------|
| 1 | [`README.md`](../README.md) | Raiz | Visão geral do repositório: stack, setup, build APK | ✅ |
| 2 | [`1_ARQUITETURA.md`](./1_ARQUITETURA.md) | Técnico | Stack, autenticação, endpoints, modelo de dados | ✅ |
| 3 | [`2_12_ETAPAS.md`](./2_12_ETAPAS.md) | Processo | Mapeamento das 12 etapas e documentação de entrada | ✅ |
| 4 | [`3_TELAS.md`](./3_TELAS.md) | Produto | Telas por perfil e regras de visibilidade | ✅ |
| 5 | [`4_BACKEND_ADEQUACOES.md`](./4_BACKEND_ADEQUACOES.md) | Técnico | Novas tabelas, endpoints e integração RouteXL | ✅ |
| 6 | [`5_DESENVOLVIMENTO.md`](./5_DESENVOLVIMENTO.md) | Técnico | Setup, build local e código de exemplo | ✅ |
| 7 | [`6_PERFIS_ACESSO.md`](./6_PERFIS_ACESSO.md) | Segurança | Multi-perfil, visibilidade de dados e fluxos | ✅ |
| 8 | [`7_ALMOXARIFADO.md`](./7_ALMOXARIFADO.md) | Produto | Substituição da planilha manual | ✅ |
| 9 | [`8_ADMIN_PAINEL_ADEQUACOES.md`](./8_ADMIN_PAINEL_ADEQUACOES.md) | Técnico | Adequações do painel admin pós-app | ✅ |
| 10 | [`TAREFAS.md`](./TAREFAS.md) | Gestão | 78 tarefas em 6 sprints (status por tarefa) | ✅ |
| 11 | [`PRD.md`](./PRD.md) | Produto | Especificação de produto consolidada (PRD) | ✅ Novo |
| 12 | [`DIAGRAMAS.md`](./DIAGRAMAS.md) | Técnico | Diagramas de arquitetura e sequência | ✅ Novo |
| 13 | [`MAPA_NAVEGACAO.md`](./MAPA_NAVEGACAO.md) | Grafo | Mapa de navegação entre documentos | ✅ Novo |
| 14 | [`CHANGELOG.md`](./CHANGELOG.md) | Gestão | Histórico de versões do app | ✅ Novo |
| 15 | [`ORQUESTRACAO_48_AGENTES.md`](./ORQUESTRACAO_48_AGENTES.md) | Gestão | Validação dos 48 agentes (plano + relatórios por fase) | 🟡 Ativo |
| 16 | [`SPRINT1_B1_DETALHAMENTO.md`](./SPRINT1_B1_DETALHAMENTO.md) | Detalhamento | Tabela `etapas_producao` | ✅ |
| 17 | [`SPRINT1_B2_DETALHAMENTO.md`](./SPRINT1_B2_DETALHAMENTO.md) | Detalhamento | Tabela `carregamento_veiculo` | ✅ |
| 18 | [`SPRINT1_B3_DETALHAMENTO.md`](./SPRINT1_B3_DETALHAMENTO.md) | Detalhamento | Multi-perfil (`perfisApp`) | ✅ |
| 19 | [`SPRINT1_B3_1_DETALHAMENTO.md`](./SPRINT1_B3_1_DETALHAMENTO.md) | Detalhamento | Endpoint `PATCH /api/usuarios/:id/perfis` | ✅ |
| 20 | [`SPRINT1_B4_DETALHAMENTO.md`](./SPRINT1_B4_DETALHAMENTO.md) | Detalhamento | Login com `rememberMe` e `transportadorId` | ✅ |
| 21 | [`SPRINT1_B5_DETALHAMENTO.md`](./SPRINT1_B5_DETALHAMENTO.md) | Detalhamento | Endpoint iniciar etapa + admin com perfisApp | ✅ |
| 22 | [`SPRINT1_B6_DETALHAMENTO.md`](./SPRINT1_B6_DETALHAMENTO.md) | Detalhamento | Endpoint concluir etapa + sincronização de fases | ✅ |
| 23 | [`Pesquisa-umarizal.app.md`](./Pesquisa-umarizal.app.md) | Pesquisa | Pesquisa complementar (documentação histórica) | ✅ |

## 🔗 Documentos de outros repositórios

| Repositório | Documento | Descrição |
|-------------|-----------|-----------|
| `backend/` | `README.md`, `prisma/schema.prisma` | API Express 5/Prisma 7 em produção |
| `orquestrador_central/` | `INICIAR.md` | Portaria e framework autogerenciado (somente leitura) |

## 📌 Convenção de atualização

- Cada tarefa concluída atualiza `TAREFAS.md` e, se aplicável, o detalhamento correspondente
- A Fase 2 da orquestração mantém este índice e o mapa de navegação sempre atuais
- `CHANGELOG.md` é atualizado a cada release/entrega relevante

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · SOCGPT — índice central -->
