/**
 * theme/index.ts — Tema dark do app Umarizal
 *
 * Cores extraídas do painel admin (site/src/styles/global.css + dark mode):
 * - Fundo gray-900 (#111827), superfícies gray-800 (#1f2937), bordas gray-700
 * - Texto gray-100/gray-400, acento gradiente blue-700 → blue-500
 * - Cores da marca: azul #0a2640, rosa #c28b9f, lima #bcd85f, dourado #d4af37
 */

export const colors = {
  // Fundo e superfícies (dark mode do painel admin)
  background: '#111827', // gray-900
  surface: '#1f2937', // gray-800
  surfaceAlt: '#374151', // gray-700
  border: '#374151', // gray-700

  // Texto
  text: '#f3f4f6', // gray-100
  textSecondary: '#9ca3af', // gray-400
  textMuted: '#6b7280', // gray-500

  // Acento (azul do painel admin)
  primary: '#3b82f6', // blue-500
  primaryDark: '#1d4ed8', // blue-700
  active: '#93c5fd', // blue-300
  activeBg: 'rgba(30, 64, 175, 0.3)', // blue-900/30

  // Semânticos
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#38bdf8', // sky-400

  // Cores da marca (tema do site lavanderiaumarizal.com.br)
  brandBlue: '#0a2640', // primary-blue
  brandBlueLight: '#1a4a6b', // primary-light
  brandPink: '#c28b9f', // secondary-pink
  brandPinkLight: '#e8b4cb', // secondary-light
  brandLime: '#bcd85f', // lime-green
  brandGold: '#d4af37', // gold-accent
} as const;

/** Gradiente do logo do painel admin (blue-700 → blue-500) */
export const primaryGradient: readonly [string, string] = ['#1d4ed8', '#3b82f6'];

/** Estados das etapas (padrão do app) */
export const etapaStatusColors: Record<string, string> = {
  pendente: colors.textMuted,
  em_andamento: colors.primary,
  concluida: colors.success,
} as const;
