# 🕸️ Mapa de Navegação — umarizal.app

> **Agente:** ObsidianArchitectGPT — Arquitetura do Grafo (Fase 2, #8)
> **Status:** ✅ Validado — grafo de conhecimento atualizado

## 🌐 Grafo de Documentos

```mermaid
graph TD
    README[README.md - Raiz] --> DOC1[1_ARQUITETURA]
    README --> TAREFAS[TAREFAS.md - 78 tarefas]
    README --> CHANGELOG[CHANGELOG.md]
    README --> ORQ[ORQUESTRACAO_48_AGENTES]

    DOC1 --> DOC4[4_BACKEND_ADEQUACOES]
    DOC1 --> DOC6[6_PERFIS_ACESSO]
    DOC4 --> B1[SPRINT1_B1_DETALHAMENTO]
    DOC4 --> B2[SPRINT1_B2_DETALHAMENTO]
    DOC4 --> B4[SPRINT1_B4_DETALHAMENTO]
    DOC4 --> B5[SPRINT1_B5_DETALHAMENTO]
    DOC4 --> B6[SPRINT1_B6_DETALHAMENTO]

    DOC6 --> B3[SPRINT1_B3_DETALHAMENTO]
    DOC6 --> B31[SPRINT1_B3_1_DETALHAMENTO]

    DOC2[2_12_ETAPAS] --> DOC3[3_TELAS]
    DOC2 --> DOC7[7_ALMOXARIFADO]
    DOC3 --> DOC8[8_ADMIN_PAINEL_ADEQUACOES]
    DOC7 --> DOC5[5_DESENVOLVIMENTO]

    PRD[PRD.md] --> TAREFAS
    PRD --> DOC2
    UML[DIAGRAMAS.md] --> DOC1
    UML --> DOC4

    INDICE[INDICE_DOCUMENTACAO.md] -.-> README
    MAPA[MAPA_NAVEGACAO.md] -.-> INDICE
```

## 🧭 Como navegar

| Se você quer... | Comece por |
|-----------------|------------|
| Entender o projeto rapidamente | `README.md` → `1_ARQUITETURA.md` |
| Saber o que está implementado/pendente | `TAREFAS.md` |
| Ver o fluxo das 12 etapas | `2_12_ETAPAS.md` |
| Ver as telas por perfil | `3_TELAS.md` |
| Entender permissões e privacidade | `6_PERFIS_ACESSO.md` |
| Ver o histórico de versões | `CHANGELOG.md` |
| Acompanhar a validação dos 48 agentes | `ORQUESTRACAO_48_AGENTES.md` |

## 🔁 Manutenção do grafo

- Novos documentos devem ser registrados em `INDICE_DOCUMENTACAO.md` e ligados no grafo acima
- Documentos obsoletos devem ser marcados e removidos do grafo
- Revisão a cada fase concluída da orquestração

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · ObsidianArchitectGPT — grafo de conhecimento -->
