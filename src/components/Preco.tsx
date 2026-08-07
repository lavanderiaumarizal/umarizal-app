/**
 * components/Preco.tsx — Exibição de valores financeiros (F36)
 *
 * Só renderiza o valor se o usuário logado tiver o perfil 'admin'.
 * (O backend também filtra valores para não-admin — este componente é o
 * reforço de segurança no frontend, doc 6.)
 */

import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

interface Props {
  value?: number | null;
  style?: StyleProp<TextStyle>;
  /** Prefixo padrão R$ */
  prefixo?: string;
}

export default function Preco({ value, style, prefixo = 'R$ ' }: Props) {
  const perfis = useAuthStore((s) => s.user?.perfis) ?? [];

  if (!perfis.includes('admin') || value === undefined || value === null) {
    return null;
  }

  const formatado = `${prefixo}${value.toFixed(2).replace('.', ',')}`;

  return <Text style={style ?? { color: colors.brandGold, fontWeight: 'bold' }}>{formatado}</Text>;
}
