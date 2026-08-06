/**
 * store/appStore.ts — Estado global do app (F7.1)
 *
 * - Perfil ativo (para usuários multi-perfil)
 * - Preferências (tema sempre dark)
 * - Última rota visitada
 *
 * Persistência via AsyncStorage (zustand/middleware persist).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Perfil } from '../types';

interface AppState {
  /** Perfil ativo quando o usuário tem múltiplos perfis */
  perfilAtivo: Perfil | null;
  /** Última rota/tela visitada (retomada de contexto) */
  ultimaRota: string | null;
  setPerfilAtivo: (perfil: Perfil | null) => void;
  setUltimaRota: (rota: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      perfilAtivo: null,
      ultimaRota: null,

      setPerfilAtivo: (perfil) => set({ perfilAtivo: perfil }),
      setUltimaRota: (rota) => set({ ultimaRota: rota }),
    }),
    {
      name: '@umarizal:app',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
