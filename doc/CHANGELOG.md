# 📜 Changelog — umarizal.app

> **Agente:** ChronosGPT — Git operations e CHANGELOG (Fase 2, #12)
> **Formato:** baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
> **Nota:** tarefas de backend (B1–B23) são versionadas no repositório `backend/`

## [1.1.0] — 2026-08-10 · Melhorias da orquestração dos 48 agentes

### ✨ Adicionado
- `.env.example` com `EXPO_PUBLIC_API_URL` — URL da API configurável (R-4, SecretsGuardianGPT)
- 13 documentos de validação/orquestração (Fases 1–7: gestão, documentação, jurídica, marketing, projetos, desenvolvedores)

### 🐛 Correções
- **401 com mensagem clara**: sessão expirada agora exibe "Sessão expirada. Entre novamente." na tela de login (R-1, ErrorReporterGPT)
- Comentário do `authStore` corrigido: o backend **valida** o token a cada request (não renova) (R-3, ModernBackendGPT)

### 🧪 Qualidade
- Regressão final: backend **126/126 testes** ✅ · app `tsc --noEmit` ✅

## [1.0.0] — 2026-08-10 · APK v4 homologado

### 🐛 Correções
- **Login:** desempacotamento correto da resposta `{ success, data: { token, usuario } }`
- **Login:** timeout de 30s e mensagem de erro detalhada para diagnóstico
- **Login:** chave válida para SecureStore (`umarizal.token`) — corrige `invalid key provided to SecureStore`
- **Login:** teclado sem shift inicial na senha

### 🗺️ Melhorias
- Mapa migrado para **MapLibre + OpenStreetMap** (OpenFreeMap) — sem Google Maps, sem chave de API
- Documentação de status alinhada com o estado real (TAREFAS.md)
- Início da orquestração de validação dos **48 agentes** (Fase 1 — Gestão concluída)

## [0.9.0] — Build e distribuição

### ✨ Adicionado
- Projeto EAS vinculado (projectId `f635674a-…`) e `android.package` = `com.umarizal.app`
- Perfil de build `preview` e **APK v4** assinado gerado

## [0.8.0] — Sprint 5: Expedição e Documentação

### ✨ Adicionado
- F26/F27: **Almoxarifado/estoque** (substitui a planilha) + flag de carregamento
- F28: **Inspeção final** (checklist OK/NOK)
- F29: **Embalagem** (etapa 11) com foto opcional
- F30: **Relatório do dia** com compartilhamento
- F31–F35: **Documentação de entrada** com fotos vinculadas por item
- F36: componente **Preco** (oculta valores para perfis não-admin)

## [0.7.0] — Sprint 4: Produção

### ✨ Adicionado
- F20–F25: filas de **lavagem e secagem** com avanço de etapas, observações e fotos de produção

## [0.6.0] — Sprint 3: Motorista

### ✨ Adicionado
- F14: **Rota do Dia** com geração otimizada (RouteXL), flip e salvamento
- F14.1: **Mapa da rota** (pins coleta/entrega + linha)
- F14.2/F14.3/F14.4: gerar rota, flip e salvar rota
- F15/F16: **coleta** (fotos + assinatura) e **entrega** (assinatura)
- F17/F18: componentes **SignaturePad** e **PhotoCapture**
- F19: navegação externa para o endereço · F19.1: paradas concluídas desabilitadas

## [0.5.0] — Sprint 2: Kanban

### ✨ Adicionado
- F8: **Dashboard por perfil**
- F9: **Kanban por fase** · F10: detalhes do tapete · F11–F13: timeline, card e badge

## [0.4.0] — Sprint 1: Fundação do app

### ✨ Adicionado
- F1/F2: setup Expo (SDK 57) e estrutura de pastas
- F3/F7.2: **Auth store** (Zustand + SecureStore)
- F4: **Axios client** com interceptors (Bearer + 401)
- F5/F6/F7: **Login**, navegação e persistência de sessão
- F7.1: store global com tema dark do painel admin

## [0.3.0] — Documentação inicial

### ✨ Adicionado
- Plano completo do projeto em `doc/` (documentos 1–8, TAREFAS.md, detalhamentos B1–B6)

---
*Changelog mantido pelo ChronosGPT (Fase 2 — Documentação) e atualizado a cada entrega relevante.*
