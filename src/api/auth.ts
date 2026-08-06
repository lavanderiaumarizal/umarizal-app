/**
 * api/auth.ts — Endpoints de autenticação (F5)
 *
 * POST /api/auth/login  → login unificado com rememberMe (B4)
 * GET  /api/auth/me     → dados do usuário logado
 */

import api from './client';
import type { LoginResponse, Usuario, ApiSuccessResponse } from '../types';

/** Login com rememberMe: true → token de 30 dias (app mobile) */
export async function login(email: string, senha: string, rememberMe = false): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', {
    email,
    senha,
    rememberMe,
  });
  return data;
}

/** Valida o token e retorna os dados do usuário */
export async function getMe(): Promise<ApiSuccessResponse<Usuario>> {
  const { data } = await api.get<ApiSuccessResponse<Usuario>>('/auth/me');
  return data;
}
