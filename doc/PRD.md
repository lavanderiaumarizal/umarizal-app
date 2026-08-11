# 📄 PRD — umarizal.app (Aplicativo de Logística Interna)

> **Agente:** PRDGPT — Especificação de Produto (Fase 2, #9)
> **Status:** ✅ Validado — funcionalidades implementadas conferem com o escopo (F1–F36)

## 🎯 Objetivo do Produto

Substituir a planilha manual de controle de entrada/saída de tapetes por um aplicativo móvel que acompanha cada tapete pelas **4 fases e 12 etapas** do Padrão Umarizal, com coleta de evidências (fotos e assinaturas), rota otimizada para o motorista e visibilidade por perfil.

## 👥 Personas

| Perfil | Necessidade principal |
|--------|----------------------|
| **Motorista** | Rota do dia otimizada, coleta com foto, entrega com assinatura |
| **Expedição** | Documentação de entrada com fotos por item, almoxarifado, inspeção, embalagem |
| **Lavagem / Secagem** | Filas de produção e avanço de etapas com observações |
| **Admin** | Visão completa, incluindo valores financeiros |

## 📋 Requisitos Funcionais (RF) — mapeados para a implementação

| RF | Descrição | Implementação | Status |
|----|-----------|---------------|--------|
| RF-1 | Login com persistência segura (token JWT no SecureStore) | F3, F5, F7, F7.2 + B4 | ✅ |
| RF-2 | Dashboard por perfil | F8 + B18 | ✅ |
| RF-3 | Kanban de produção por fase | F9–F13 + B18 | ✅ |
| RF-4 | Rota do dia com geração otimizada (RouteXL), flip e salvamento | F14, F14.2–F14.4 + B22, B23 | ✅ |
| RF-5 | Mapa da rota (pins coleta/entrega + linha) | F14.1 | ✅ |
| RF-6 | Coleta: foto(s) + assinatura + observações | F15, F17, F18 + B9 | ✅ |
| RF-7 | Entrega: assinatura digital | F16, F17 + B10 | ✅ |
| RF-8 | Paradas concluídas desabilitadas automaticamente | F19.1 + B23 | ✅ |
| RF-9 | Navegação externa para o endereço da parada | F19 | ✅ |
| RF-10 | Filas de lavagem e secagem com avanço de etapas | F20–F25 + B6–B8 | ✅ |
| RF-11 | Observações e fotos por etapa de produção | F24, F25 | ✅ |
| RF-12 | Almoxarifado/estoque com flag de carregamento | F26, F27 + B11, B12 | ✅ |
| RF-13 | Inspeção final (checklist OK/NOK) e embalagem | F28, F29 | ✅ |
| RF-14 | Relatório do dia com compartilhamento | F30 | ✅ |
| RF-15 | Documentação de entrada com fotos vinculadas por item | F31–F35 + B21 | ✅ |
| RF-16 | Ocultação de valores financeiros para perfis não-admin | F36 + B20 | ✅ |

## ⚙️ Requisitos Não Funcionais (RNF)

| RNF | Descrição | Evidência |
|-----|-----------|-----------|
| RNF-1 | Segurança: token JWT armazenado em SecureStore | F7.2 (Keychain/EncryptedSharedPreferences) |
| RNF-2 | Segurança: HTTPS obrigatório | `API_URL` = `https://api.lavanderiaumarizal.com.br` |
| RNF-3 | Segurança: rate limiting (login 10/min, app 60/min) | B17 |
| RNF-4 | Segurança: RBAC multi-perfil | B15 + `permissions.ts` |
| RNF-5 | Privacidade: sem valores financeiros fora do admin | B20 + componente `Preco` |
| RNF-6 | Performance: timeout de 30s nas chamadas | `client.ts` |
| RNF-7 | Offline resiliente: erros de rede tratados com mensagem clara | Mensagens nas telas |
| RNF-8 | Custo zero de mapa (sem chave de API) | MapLibre + OpenStreetMap (F19) |

## 🎯 Priorização (MoSCoW)

| Prioridade | Itens |
|------------|-------|
| **Must (obrigatório)** | RF-1 a RF-8, RF-10 a RF-16 |
| **Should (importante)** | RF-9 (navegação externa) |
| **Could (desejável)** | F30.1 (notificações push — sprint futura) |
| **Won't (agora)** | Multi-tenant (single-tenant), SEO, landing pages |

## ✅ Critérios de Aceite Gerais

- [ ] Todas as 12 etapas rastreáveis por orçamento em produção (540 etapas criadas — B16)
- [ ] Login homologado em produção com APK v4
- [ ] 127 testes passando no backend
- [ ] Nenhum valor financeiro exposto para perfis não-admin
- [ ] Mapa funcional sem chave de API

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · PRDGPT — especificação de produto -->
