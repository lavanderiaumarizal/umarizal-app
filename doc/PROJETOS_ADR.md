# 🏗️ ADRs — Decisões de Arquitetura (umarizal.app + backend)

> **Agente:** TechLeadGPT — Arquitetura e Governança Técnica (Fase 5, #26)
> **Status:** ✅ ADRs registrados em 2026-08-10
> **Formato:** ADR (Architecture Decision Record) — decisões, contexto e consequências

---

## ADR-001 — Expo SDK 57 (React Native 0.86, React 19, TypeScript)

- **Status:** ✅ Aceita
- **Contexto:** app mobile de logística precisa de câmera, assinatura, mapa, SecureStore e notificações futuras
- **Decisão:** `create-expo-app` com Expo SDK 57 e EAS Build para gerar APK
- **Consequências:** atualizações via `expo upgrade`; builds gerenciados (EAS) sem Android Studio local

## ADR-002 — Mapa com MapLibre + OpenStreetMap (OpenFreeMap) — sem chave de API

- **Status:** ✅ Aceita (substitui proposta inicial com Google Maps)
- **Contexto:** usuário sem conta/configuração no Google Cloud; custo zero desejado
- **Decisão:** `@maplibre/maplibre-react-native` com tiles OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`)
- **Consequências:** sem chave, sem cobrança, sem dependência de provedor; deep link externo mantido (F19)
- **Alternativas rejeitadas:** `react-native-maps` + Google (exigia chave/API key)

## ADR-003 — Estado e persistência: Zustand + SecureStore (token) / AsyncStorage (perfil)

- **Status:** ✅ Aceita
- **Contexto:** token JWT é sensível; perfil não
- **Decisão:** `expo-secure-store` para token (Keychain/EncryptedSharedPreferences), AsyncStorage para dados não sensíveis; chave `umarizal.token` (só alfanumérica/`.`/`-`/`_`)
- **Consequências:** Android exige chave sem `@`/`:` — aprendizado registrado

## ADR-004 — Backend Express 5 + Prisma 7 + PostgreSQL + Redis (deploy via Dokploy)

- **Status:** ✅ Aceita (produção)
- **Contexto:** backend legado em produção (`api.lavanderiaumarizal.com.br`)
- **Decisão:** manter Express 5 + Prisma 7 com adapters `@prisma/adapter-pg`; deploy automático via webhook Dokploy; entrypoint roda `prisma migrate deploy` + seeds (com `tsx`)
- **Consequências:** **não usar `prisma db push`** (coluna gerada `duracao_seg` em `historico_fases` quebra); usar migrações

## ADR-005 — Navegação apenas com `native-stack` (sem `@react-navigation/stack`)

- **Status:** ✅ Aceita
- **Contexto:** peer dependency `react-native-gesture-handler` causava conflito
- **Decisão:** usar somente `@react-navigation/native-stack` + `bottom-tabs`
- **Consequências:** menos dependências, sem gesture-handler

## ADR-006 — Scripts com `tsx` em vez de `ts-node` nos containers

- **Status:** ✅ Aceita
- **Contexto:** `ts-node` global quebrado no container (TS 6/Node 22: `Cannot read properties of undefined (reading 'fileExists')`)
- **Decisão:** todos os seeds/scripts usam `tsx`
- **Consequências:** seeds idempotentes rodam no entrypoint do deploy

## ADR-007 — RBAC multi-perfil com `requirePerfil(...)` e admin sempre liberado

- **Status:** ✅ Aceita
- **Contexto:** colaboradores com múltiplas funções (ex.: motorista + expedição)
- **Decisão:** array `perfis` no JWT + middleware `requirePerfil` (B15); `nivel` mantido para compatibilidade
- **Consequências:** valores financeiros ocultos fora do admin (B20/F36)

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · TechLeadGPT — governança técnica -->
