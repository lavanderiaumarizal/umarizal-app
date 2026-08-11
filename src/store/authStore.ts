/**
 * store/authStore.ts — Autenticação (Zustand + SecureStore + AsyncStorage)
 *
 * - Token JWT → expo-secure-store (Keychain/EncryptedSharedPreferences)
 * - Perfil do usuário → AsyncStorage (dados não sensíveis)
 * - Sessão persistente: nunca desloga a menos que o usuário clique em "Sair"
 *   (o token tem validade de 30 dias com rememberMe; o backend valida o token a
 *   cada request — se expirado/inválido, o app encerra a sessão com a mensagem
 *   "Sessão expirada" — ver client.ts R-1)
 *
 * Ref.: doc/5_DESENVOLVIMENTO.md (5.5) e tarefa F3/F7.2
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from '../types';

// ⚠️ SecureStore (Android) só aceita chaves com letras/números, '.', '-', '_'
// (NÃO aceita '@', ':' — causa 'invalid key provided to SecureStore')
const TOKEN_KEY = 'umarizal.token';
const USER_KEY = '@umarizal:user'; // AsyncStorage aceita qualquer string

interface AuthState {
  token: string | null;
  user: Usuario | null;
  /** true enquanto carrega a sessão persistida na abertura do app */
  isLoading: boolean;
  /** true quando uma sessão foi encerrada por 401 (token expirado/inválido) */
  sessionExpired: boolean;
  setSessionExpired: (value: boolean) => void;
  setToken: (token: string) => Promise<void>;
  setUser: (user: Usuario) => Promise<void>;
  setSession: (token: string, user: Usuario) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  sessionExpired: false,

  setSessionExpired: (value: boolean) => set({ sessionExpired: value }),

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token); // Keychain seguro
    set({ token });
  },

  setUser: async (user: Usuario) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  setSession: async (token: string, user: Usuario) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },

  loadStoredAuth: async () => {
    try {
      const [token, userData] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      const user = userData ? (JSON.parse(userData) as Usuario) : null;
      set({ token, user, isLoading: false });
    } catch {
      set({ token: null, user: null, isLoading: false });
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    set({ token: null, user: null });
  },
}));
