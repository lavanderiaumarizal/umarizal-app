# 📱 umarizal.app — Aplicativo de Logística Interna da Lavanderia Umarizal

Aplicativo móvel (React Native/Expo) que **substitui a planilha manual** de controle de entrada/saída de tapetes e gerencia as **4 fases e 12 etapas** do Padrão Umarizal: rota do motorista, coleta com foto e assinatura, documentação de entrada, filas de lavagem/secagem, inspeção, embalagem e entrega.

> 🔗 Backend (API Express 5/Prisma 7): [`lavanderiaumarizal/backend`](https://github.com/lavanderiaumarizal/backend) — em produção em `https://api.lavanderiaumarizal.com.br`

## ✨ Funcionalidades

- 🔐 **Login seguro** com token JWT no SecureStore (Keychain) e "Manter conectado" (30 dias)
- 🏠 **Dashboard por perfil**: motorista, lavagem, secagem, expedição, admin
- 🗂️ **Kanban de produção** com as 12 etapas rastreáveis
- 🚚 **Rota do Dia** do motorista: geração otimizada (RouteXL), flip, salvamento, mapa (MapLibre/OSM, sem chave de API)
- 📸 **Coleta** com fotos + assinatura digital · **Entrega** com assinatura
- 🧺 **Almoxarifado** (substitui a planilha) com flag de carregamento
- 📋 **Documentação de entrada** com fotos vinculadas por item
- 📊 **Relatório do dia** com compartilhamento
- 🔒 **Privacidade**: valores financeiros visíveis apenas para o perfil admin

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native 0.86 · Expo SDK 57 · React 19 · TypeScript |
| Navegação | `@react-navigation/native` + `native-stack` + `bottom-tabs` |
| Estado | Zustand (`authStore` + `appStore`) |
| Persistência | `expo-secure-store` (token) · AsyncStorage (perfil) |
| API | Axios com interceptors (Bearer token + 401) |
| Mapa | `@maplibre/maplibre-react-native` + OpenFreeMap (OpenStreetMap) |
| Câmera/Assinatura | `expo-camera` · canvas de assinatura |

## 📁 Estrutura

```
umarizal.app/
├── App.tsx                 # Navegação raiz (Login ↔ Dashboard)
├── app.json / eas.json     # Configuração Expo + perfis EAS
├── src/
│   ├── api/                # client axios + endpoints (auth, orcamentos, routexl, kanban...)
│   ├── components/         # StatusBadge, KanbanCard, EtapaTimeline, SignaturePad,
│   │                       # CameraCapture, MapaRota, Preco, InspecaoChecklist...
│   ├── screens/            # Login, Dashboard, KanbanProducao, RotaDoDia, Producao,
│   │                       # Almoxarifado, Documentacao, DocumentacaoOrcamento,
│   │                       # DetalhesOrcamento, RelatorioDia
│   ├── store/              # authStore (Zustand + SecureStore), appStore
│   ├── navigation/         # navegadores
│   ├── hooks/              # hooks reutilizáveis
│   └── types/              # tipos TypeScript (Usuario, Orcamento, Rota...)
└── doc/                    # Documentação completa (ver índice)
```

## 🚀 Setup e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npx expo start

# 3. Variáveis de ambiente (opcional)
# EXPO_PUBLIC_API_URL=https://api.lavanderiaumarizal.com.br/api
```

## 📦 Build do APK (EAS)

```bash
# Login no EAS (uma vez por máquina)
npx eas-cli login

# Build Android (perfil preview)
npx eas-cli build --platform android --profile preview --non-interactive --no-wait

# Acompanhar o build
npx eas-cli build:view <build-id> --json
```

> `android.package` = `com.umarizal.app` · projectId EAS = `f635674a-9bbe-47f5-bf93-975664e953ab`

## 🧪 Testes

- Backend: `npm test` (127 testes) — repo `backend/`
- App: validação manual via APK (Q1–Q8 em andamento — ver `doc/TAREFAS.md`)

## 📚 Documentação

Índice completo: [`doc/INDICE_DOCUMENTACAO.md`](doc/INDICE_DOCUMENTACAO.md) · Mapa de navegação: [`doc/MAPA_NAVEGACAO.md`](doc/MAPA_NAVEGACAO.md) · Tarefas: [`doc/TAREFAS.md`](doc/TAREFAS.md) · Changelog: [`doc/CHANGELOG.md`](doc/CHANGELOG.md)

## 📌 Status

🟢 **Em produção** — APK v4 homologado (login validado) · backend em `api.lavanderiaumarizal.com.br` · orquestração de validação dos 48 agentes em andamento.

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · ReadmeGenGPT — documentação técnica -->
