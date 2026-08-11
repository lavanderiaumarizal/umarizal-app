# 🏃 Plano da Sprint de Testes (Q1–Q8) — umarizal.app

> **Agente:** ScrumMasterTechGPT — Gestão Técnica de Sprints (Fase 5, #27)
> **Status:** ✅ Plano elaborado em 2026-08-10

## 🎯 Objetivo da Sprint

**"O app operando com a equipe real"** — validar cada jornada (ver `MARKETING_JORNADA.md`), corrigir bugs encontrados e entregar o APK distribuído + manual.

## 📋 Itens da Sprint (ordem sugerida)

| # | Item | Responsável | Critério de pronto |
|---|------|-------------|--------------------|
| 1 | Preparar dispositivos (instalar APK v4 por cima) | Usuário + equipe | APK instalado no celular do motorista |
| 2 | **Q1** Motorista: rota + coleta (foto/assinatura) + entrega | Motorista | Paradas concluídas aparecem desabilitadas |
| 3 | **Q2** Lavagem: iniciar/concluir lavagem | Equipe lavagem | Etapa 5 concluída no orçamento de teste |
| 4 | **Q3** Secagem: iniciar/concluir secagem | Equipe secagem | Etapa 9 concluída |
| 5 | **Q4** Expedição: documentação + almoxarifado + inspeção + embalagem | Equipe expedição | Etapa 11 concluída + fotos por item |
| 6 | Bugfixes do feedback (itens P1 do backlog) | Dev (eu) | Corrigido e commitado |
| 7 | **Q7** Distribuir APK v4 (WhatsApp) | Usuário | Link/APK enviado com instruções |
| 8 | **Q8** Manual de uso (prints) | Dev (eu) | Manual em `doc/` |
| 9 | **Q5** Ajustes de UX com feedback | Dev (eu) | Ajustes aprovados pelo usuário |

## 🚦 Ritual

- **Daily (rápida):** ao final de cada dia de teste, usuário reporta o que funcionou/quebrou
- **Review:** após Q1–Q4, resumo com o usuário (o que manter/melhorar)
- **Validação humana:** cada item só fecha com **OK** do usuário

## ⚠️ Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Equipe sem tempo/horário | Testar em janelas curtas (ex.: 20 min por perfil) com dados de teste |
| Bug bloqueante em campo | App tem pull-to-refresh e mensagens de erro; backend loga erros |
| APK desatualizado | Buildar nova versão sob demanda (EAS preview) e instalar por cima (mesma assinatura) |

## 🏁 Definition of Done da Sprint

- [ ] Q1–Q4 validados com equipe real
- [ ] Bugs corrigidos e commitados
- [ ] APK distribuído (Q7)
- [ ] Manual criado (Q8)
- [ ] `TAREFAS.md` com Q1–Q8 ✅

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · ScrumMasterTechGPT — gestão de sprints -->
