/**
 * api/client.ts — Axios instance com interceptors (F4)
 *
 * - Base: https://api.lavanderiaumarizal.com.br/api (configurável via EXPO_PUBLIC_API_URL)
 * - Request: injeta `Authorization: Bearer <token>` do authStore
 * - Response: 401 → encerra a sessão com aviso de "Sessão expirada" (R-1)
 * - HTTPS obrigatório (doc 1.1)
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// R-4: URL configurável via variável de ambiente do Expo (EXPO_PUBLIC_*),
// com fallback para a API de produção.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.lavanderiaumarizal.com.br/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de request: adiciona token em toda requisição
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: se 401, encerra a sessão com aviso claro (R-1)
// (o backend valida o token a cada request; logout só em ação explícita ou 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { token, logout, setSessionExpired } = useAuthStore.getState();
      if (token) {
        setSessionExpired(true); // Login exibirá "Sessão expirada. Entre novamente."
        void logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
