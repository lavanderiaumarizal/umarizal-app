# 5. Plano de Desenvolvimento

## 5.1 Setup do Projeto

```bash
# Criar projeto Expo
npx create-expo-app@latest umarizal-app --template blank-typescript
cd umarizal-app

# Dependências principais
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install axios
npm install react-native-signature-canvas  # assinatura digital
npm install expo-camera  # fotos
npm install expo-file-system
npm install expo-location  # GPS para motorista

# Dependências extras (recomendadas pela pesquisa complementar)
npm install zustand                                  # Estado global (leve e tipado)
npm install react-native-maps                        # Mapa da rota do dia
npm install expo-secure-store                        # Armazenamento seguro do token (Keychain)
# Alternativa ao AsyncStorage para maior performance (opcional):
# npm install react-native-mmkv

# Push notifications (opcional — pode ser adicionado depois)
# npm install expo-notifications
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
- Setup do projeto Expo + dependências (zustand, expo-secure-store, react-native-maps)
- Tela de login + persistência segura (expo-secure-store para token, AsyncStorage para dados não sensíveis)
- Dashboard por perfil
- Integração com backend (axios interceptors)

### Sprint 2 — Kanban e Etapas (5 dias)
- Kanban por fase (3 colunas)
- Detalhes do tapete
- Avanço/retorno de etapas
- Criação da tabela `etapas_producao` no backend

### Sprint 3 — Motorista (4 dias)
- Rota do dia (RouteXL) com mapa (react-native-maps)
- Coleta com foto + assinatura
- Entrega com assinatura
- Flag de carregamento no veículo
- Integração com Google Maps (deep link)

### Sprint 4 — Lavagem e Secagem (3 dias)
- Fila de lavagem
- Fila de secagem
- Câmera para fotos de produção
- Observações por etapa

### Sprint 5 — Expedição e Finalização (3 dias)
- Inspeção final (checklist)
- Embalagem
- Relatório do dia
- Notificações internas (opcional: expo-notifications)

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
│   │   ├── authStore.ts       # Zustand + SecureStore (token)
│   │   └── appStore.ts        # Zustand global (perfil, preferências)
│   └── types/
│       ├── orcamento.ts
│       ├── etapa.ts
│       └── rota.ts
├── app.json
├── App.tsx
└── package.json
```

## 5.5 Persistência de Login (Zustand + SecureStore)

```typescript
// store/authStore.ts — Zustand + expo-secure-store (token) + AsyncStorage (user)
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@umarizal:token';
const USER_KEY = '@umarizal:user';

type AuthState = {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  setUser: (user: any) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token); // Keychain seguro
    set({ token });
  },

  setUser: async (user: any) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);
      const user = userData ? JSON.parse(userData) : null;
      set({ token, user, isLoading: false });
    } catch {
      set({ token: null, user: null, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.multiRemove([USER_KEY]);
    set({ token: null, user: null });
  },
}));
```

## 5.6 Axios Client com Interceptor

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'https://api.lavanderiaumarizal.com.br/api',
  timeout: 15000,
});

// Interceptor: adiciona token em toda request
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
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
      // Tenta renovar token com o backend
      // Se falhar, mantém logado com token antigo
    }
    return Promise.reject(error);
  }
);

export default api;
```
