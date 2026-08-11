# 🗺️ Jornada dos Colaboradores — umarizal.app

> **Agente:** StratFlowIA — Planejamento Estratégico (Fase 4, #20)
> **Status:** ✅ Mapa elaborado em 2026-08-10
> **Objetivo:** mapear a jornada de cada perfil no app para guiar testes (Q1–Q4) e melhorias de UX

## 🚚 Jornada do Motorista (Q1)

```
Login → Dashboard (card "Rota do Dia") → Seleciona data → Rota otimizada (RouteXL)
→ Mapa/lista de paradas → Coletar (foto + assinatura) ✓ → Parada desabilitada
→ Entregar (assinatura) ✓ → Parada desabilitada → Fim do dia
```

**Pontos de atenção:** dependência de internet para carregar rota e enviar coleta/entrega; erros de rede devem ter mensagem clara (já tratado com timeout 30s e mensagem detalhada).

## 🧺 Jornada da Expedição (Q4)

```
Login → Dashboard → Documentação de Entrada → orçamento em F1_COLETADO
→ Fotografar cada item [+] → Confirmar Documentação (etapa 2)
→ Almoxarifado → flag de carregamento do veículo
→ Inspeção final (checklist OK/NOK) → Embalar (etapa 11)
```

**Pontos de atenção:** vínculo foto-item é o coração da documentação; validar remoção de foto (F34) e a sequência inspeção→embalagem.

## 🧼 Jornada da Lavagem (Q2)

```
Login → Dashboard → Fila de Lavagem (etapa 3 ✓, 4 pendente)
→ Iniciar Lavagem → "Lavando Agora" → Concluir Lavagem (etapa 5)
→ Observações/fotos opcionais
```

## ☀️ Jornada da Secagem (Q3)

```
Login → Dashboard → Fila de Secagem (etapa 6 ✓, 7 pendente)
→ Iniciar Secagem → "Secando Agora" → Concluir Secagem (etapa 8 → 9)
```

## 🏢 Jornada do Admin

```
Login → Dashboard (tudo) → Kanban → Detalhes do tapete (timeline 12 etapas)
→ Relatório do dia (valores visíveis) → Gerenciar perfis (painel web)
```

## 🎯 Oportunidades identificadas

| Oportunidade | Perfil | Impacto | Esforço |
|--------------|--------|---------|---------|
| Notificações push (nova rota / nova fila) — F30.1 | Todos | Alto | Médio (sprint futura) |
| Mensagem clara de "sessão expirada" no 401 | Todos | Médio | Baixo (recomendação R-1 da Fase 1) |
| Suporte offline parcial (cache da rota) | Motorista | Médio | Alto (avaliar depois) |
| Tela de boas-vindas com aviso de privacidade | Todos | Baixo | Baixo (Fase 3 — legal) |

> **Uso:** este mapa orienta os testes Q1–Q4 — cada jornada deve ser percorrida integralmente antes de marcar a tarefa como ✅.

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · StratFlowIA — planejamento estratégico -->
