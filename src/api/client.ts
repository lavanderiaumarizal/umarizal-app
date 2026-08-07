/**
 * api/client.ts — Axios instance com interceptors (F4)
 *
 * - Base: https://api.lavanderiaumarizal.com.br/api
 * - Request: injeta `Authorization: Bearer <token>` do authStore
 * - Response: 401 → logout automático (sessão expirada)
 * - HTTPS obrigatório (doc 1.1)
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_URL = 'https://api.lavanderiaumarizal.com.br/api';

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

// Interceptor de response: se 401, encerra a sessão
// (o backend renova o token a cada request bem-sucedido; logout só em ação explícita)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { token, logout } = useAuthStore.getState();
      if (token) {
        void logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
