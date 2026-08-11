# 🔄 Retrospectiva das Sprints — umarizal.app

> **Agente:** AgileScrumGPT — Metodologias Ágeis/Scrum (Fase 5, #23)
> **Status:** ✅ Retrospectiva elaborada em 2026-08-10

## 🏁 O que funcionou bem

| Item | Evidência |
|------|-----------|
| Fluxo uma tarefa por vez com OK humano | B1–B17 e F1–F36 aprovados em sequência, sem retrabalho estrutural |
| Documentação viva | Detalhamentos por tarefa (SPRINT1_B*), TAREFAS.md sempre alinhada |
| Seeds idempotentes | B16 executado 2x em produção (540 etapas, sem duplicar) |
| Decisão MapLibre/OSM | Substituiu Google Maps sem chave de API e sem custo |
| Correções de login em produção | Diagnóstico rápido (SecureStore, desempacotamento, timeout) em 3 commits |
| Backend testado | 127 testes passando antes de cada release |

## ⚠️ O que atrapalhou (e como resolvemos)

| Problema | Causa raiz | Solução |
|----------|-----------|---------|
| `ts-node` quebrado no container | TS 6/Node 22 incompatível com ts-node global | Migrar scripts para **tsx** |
| `invalid key provided to SecureStore` | Chave com `@`/`:` inválida no Android | Chave `umarizal.token` |
| Login falhando sem motivo aparente | Resposta `{ success, data }` não desempacotada | Desempacotar `data.data` no `api/auth.ts` |
| Erro ao apagar usuário com vínculo | FK `transportadores_usuarioId_fkey` RESTRICT | Fluxo admin ajustado (cascade/validação) |
| Testes reais dependem de disponibilidade da equipe | Perfis operando em horário comercial | Planejar Q1–Q4 em janelas curtas e preparadas |

## 📌 Aprendizados (levar para frente)

1. **Sempre validar resposta real da API** antes de assumir o formato
2. **Preferir zero-config** (MapLibre/OSM, OpenFreeMap) quando o usuário não tem conta em provedor
3. **Seeds idempotentes** são essenciais (rodam no entrypoint do deploy)
4. Testar cada perfil com a **jornada completa** (ver `MARKETING_JORNADA.md`) antes de marcar ✅

## 🎯 Priorização Q1–Q8 (para a sprint de testes)

| Ordem | Tarefa | Justificativa |
|-------|--------|---------------|
| 1 | **Q1 — Motorista** | Maior risco operacional (rota + coleta/entrega em campo) |
| 2 | **Q2 — Lavagem** | Fluxo simples, valida o kanban |
| 3 | **Q3 — Secagem** | Idem Q2 |
| 4 | **Q4 — Expedição** | Fluxo mais longo (documentação + almoxarifado + inspeção) |
| 5 | **Q7 — Distribuição** | APK v4 já existe — basta compartilhar |
| 6 | **Q8 — Manual de uso** | Produzido com os prints dos testes |
| 7 | **Q5 — Ajustes UX** | Com o feedback real acumulado |

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · AgileScrumGPT — metodologias ágeis -->
