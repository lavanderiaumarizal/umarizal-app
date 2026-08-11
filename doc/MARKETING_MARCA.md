# 🎨 Marca e Identidade Visual — umarizal.app

> **Agente:** CMOGPT — Chief Marketing Officer (Fase 4, #19)
> **Status:** ✅ Validação concluída em 2026-08-10
> **Objetivo:** garantir consistência da marca da Lavanderia Umarizal dentro do app

## 1. Validação da identidade (verificada no código real)

| Item | Onde | Resultado |
|------|------|-----------|
| Cores da marca | `src/theme/index.ts` | ✅ **Consistente** com o site lavanderiaumarizal.com.br: azul `#0a2640` (primary-blue), azul claro `#1a4a6b`, rosa `#c28b9f`, lima `#bcd85f`, dourado `#d4af37` |
| Modo escuro | `src/theme/index.ts` | ✅ Paleta do painel admin (gray-900/800/700 + acento blue-700→blue-500) aplicada em todas as telas |
| Cores de status | `src/theme/index.ts` (`etapaStatusColors`) | ✅ Padrão único: pendente=cinza, em_andamento=azul, concluída=verde |
| Nome da marca | Telas e README | ✅ "Umarizal" e "Lavanderia Umarizal" consistentes |
| Ícones/emoji em botões | Telas (🔄 📍 💾 📷 ✓) | ✅ Tom amigável; recomenda-se manter o mesmo conjunto para não poluir |

## 2. Guia rápido de identidade no app

- **Fundo:** `#111827` · **Superfícies:** `#1f2937` · **Bordas:** `#374151`
- **Texto:** `#f3f4f6` (principal) · `#9ca3af` (secundário)
- **Acento/ações:** azul `#3b82f6` (gradiente `#1d4ed8 → #3b82f6`)
- **Semânticos:** sucesso `#22c55e` · aviso `#f59e0b` · erro `#ef4444` · info `#38bdf8`
- **Status de etapas:** pendente cinza → em_andamento azul → concluída verde

## 3. Recomendações

1. ✅ **Manter o tema centralizado** em `src/theme/index.ts` (não duplicar cores nas telas) — já é a prática atual
2. 📌 Usar a marca azul/rosa do site em futuras telas de destaque (ex.: tela de "bem-vindo" se criada)
3. 📌 Padronizar tipografia (hoje usa fonte do sistema — suficiente para app interno)
4. 📌 Ao criar novas telas, reutilizar `StatusBadge`, `KanbanCard`, `DashboardCard` e `Preco` (design system do app)

> **Conclusão:** identidade **consistente e aprovada** — o app mantém as cores oficiais da marca em modo dark, sem divergências encontradas.

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · CMOGPT — estratégia de marca -->
