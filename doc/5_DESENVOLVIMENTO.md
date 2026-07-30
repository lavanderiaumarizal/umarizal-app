# 5. Plano de Desenvolvimento

## 5.1 Setup do Projeto

```bash
# Criar projeto Expo
npx create-expo-app@latest umarizal-app --template blank-typescript
cd umarizal-app

# Dependências principais
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install axios
npm install react-native-signature-canvas  # assinatura digital
npm install expo-camera  # fotos
npm install expo-file-system
npm install expo-location  # GPS para motorista
```

## 5.2 Build Local (sem Google/Apple Store)

```bash
# Build Android APK local
npx expo install --fix
npx eas build --platform android --local --profile preview

# O APK será gerado em:
# umarizal-app/build/umarizal-app.apk

# Compartilhar por WhatsApp ou Drive
```

## 5.3 Cronograma (Sprints)

### Sprint 1 — Fundação (3 dias)
- Setup do projeto Expo
- Tela de login + persistência (AsyncStorage)
- Dashboard por perfil
- Integração com backend (axios)

### Sprint 2 — Kanban e Etapas (5 dias)
- Kanban por fase (3 colunas)
- Detalhes do tapete
- Avanço/retorno de etapas
- Criação da tabela `etapas_producao` no backend

### Sprint 3 — Motorista (4 dias)
- Rota do dia (RouteXL)
- Coleta com foto + assinatura
- Entrega com assinatura
- Flag de carregamento no veículo
- Integração com Google Maps

### Sprint 4 — Lavagem e Secagem (3 dias)
- Fila de lavagem
- Fila de secagem
- Câmera para fotos de produção
- Observações por etapa

### Sprint 5 — Expedição e Finalização (3 dias)
- Inspeção final (checklist)
- Embalagem
- Relatório do dia
- Notificações internas

### Sprint 6 — Testes e Ajustes (2 dias)
- Teste com equipe real
- Ajustes de UX
- Build final APK
- Documentação de uso

## 5.4 Estrutura de Pastas

```
umarizal-app/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance + interceptors
│   │   ├── auth.ts             # login, refresh
│   │   └── endpoints/
│   │       ├── orcamentos.ts
│   │       ├── rotas.ts
│   │       ├── etapas.ts
│   │       └── transportadores.ts
│   ├── components/
│   │   ├── KanbanCard.tsx
│   │   ├── EtapaTimeline.tsx
│   │   ├── PhotoCapture.tsx
│   │   ├── SignaturePad.tsx
│   │   └── StatusBadge.tsx
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── RotaDoDia.tsx
│   │   ├── KanbanProducao.tsx
│   │   ├── DetalhesOrcamento.tsx
│   │   ├── NovaColeta.tsx
│   │   ├── NovaEntrega.tsx
│   │   ├── Almoxarifado.tsx
│   │   └── Relatorio.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useEtapas.ts
│   ├── store/
│   │   └── authStore.ts       # AsyncStorage wrapper
│   └── types/
│       ├── orcamento.ts
│       ├── etapa.ts
│       └── rota.ts
├── app.json
├── App.tsx
└── package.json
```

## 5.5 Persistência de Login

```typescript
// store/authStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@umarizal:token';
const USER_KEY = '@umarizal:user';

export const authStore = {
  async saveToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },
  
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async saveUser(user: any) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clear() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};
```

## 5.6 Axios Client com Interceptor

```typescript
// api/client.ts
import axios from 'axios';
import { authStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'https://api.lavanderiaumarizal.com.br/api',
  timeout: 15000,
});

// Interceptor: adiciona token em toda request
api.interceptors.request.use(async (config) => {
  const token = await authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: se 401, tenta refresh (opcional)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Não desloga — apenas tenta renovar
      // Se falhar mantém logado com token antigo
    }
    return Promise.reject(error);
  }
);

export default api;
```
