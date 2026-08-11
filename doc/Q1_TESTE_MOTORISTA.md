# 🚚 Q1 — Teste com o Motorista (guia passo a passo)

> **Preparado por:** ScrumMasterTechGPT + StratFlowIA (orquestração 48 agentes)
> **Data:** 2026-08-10 · **APK:** v5 (build `212c3a8a-…`) · **Duração estimada:** 30–40 min

## 🎯 Objetivo

Validar a **jornada completa do motorista** no celular real: login → rota do dia → coleta com foto/assinatura → entrega com assinatura.

## 📲 Antes de começar

- [ ] Celular do motorista com **internet** (Wi-Fi ou 4G)
- [ ] **APK v5 instalado** (instalar por cima da v4; se aparecer erro, desinstalar e instalar)
- [ ] Usuário do motorista criado no painel admin com perfil `motorista`
- [ ] 1 orçamento de teste agendado para **hoje** (com endereço real do cliente)
- [ ] Carregador/energia suficiente no celular

## 🧪 Roteiro do teste (marque cada item)

### 1. Login
- [ ] Abrir o app → aparece tela de login
- [ ] Digitar e-mail e senha → tocar **Entrar**
- [ ] **Esperado:** abre o Dashboard do motorista (sem erro de conexão)

### 2. Rota do Dia
- [ ] Tocar no card **"Rota do Dia"**
- [ ] Selecionar a data de **hoje**
- [ ] Se não houver rota: tocar **"🔄 Gerar Rota"** → aguardar otimização → **"💾 Salvar Rota"**
- [ ] **Esperado:** lista de paradas na ordem otimizada, com tipo (Coleta/Entrega), endereço e horário

### 3. Mapa da rota
- [ ] Abrir o mapa da rota
- [ ] **Esperado:** pins verdes (coleta) e azuis (entrega), linha ligando as paradas
- [ ] Tocar em um pin → **Esperado:** nome + endereço + botão navegar

### 4. Coleta (foto + assinatura)
- [ ] Ir até o cliente e tocar **"Coletar"** na parada
- [ ] Tirar **pelo menos 1 foto** do tapete → tocar **Confirmar**
- [ ] Assinar (cliente autoriza) → tocar **Confirmar**
- [ ] **Esperado:** mensagem de sucesso e a parada fica **desabilitada (✓ verde)**

### 5. Entrega (assinatura)
- [ ] Em uma parada de entrega, tocar **"Entregar"**
- [ ] Cliente assina → **Confirmar**
- [ ] **Esperado:** sucesso e parada desabilitada (✓)

### 6. Navegação externa
- [ ] Tocar **"📍 Maps"** em uma parada
- [ ] **Esperado:** abre o mapa/navegador com o endereço destino

## 🐛 Se algo falhar (anotar para corrigir)

| O que fazer | Como anotar |
|-------------|-------------|
| Tela travou | Anotar a tela e o botão que usava |
| Mensagem de erro | Anotar o texto exato da mensagem |
| Foto/assinatura não enviou | Anotar se a internet caiu |
| Parada não desabilitou | Anotar qual parada e o que fez |

> 📱 Tirar **print** da tela de erro ajuda muito a corrigir rápido.

## ✅ Critério de aprovação (Q1 concluída)

- [ ] Login sem erros
- [ ] Rota gerada, salva e exibida na ordem certa
- [ ] Coleta com foto + assinatura concluída e parada desabilitada
- [ ] Entrega com assinatura concluída e parada desabilitada
- [ ] Mapa e navegação externa funcionando

**Quando todos os itens estiverem marcados → reporte para o usuário/admin marcar Q1 como ✅ no `TAREFAS.md`.**

<!-- Créditos: RepoCreditsAdderGPT · Q1 elaborado com base em MARKETING_JORNADA.md e PROJETOS_SPRINT_TESTES.md -->
