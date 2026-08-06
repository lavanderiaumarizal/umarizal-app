/**
 * navigation/AppNavigator.tsx — Navegação (F6/F7)
 *
 * - Stack: Login ⇄ Dashboard
 * - Se autenticado → Dashboard; senão → Login
 * - Tema dark do painel admin aplicado ao NavigationContainer
 */

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/Login';
import DashboardScreen from '../screens/Dashboard';
import KanbanProducaoScreen from '../screens/KanbanProducao';
import DetalhesOrcamentoScreen from '../screens/DetalhesOrcamento';
import RotaDoDiaScreen from '../screens/RotaDoDia';
import type { Perfil } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Kanban: { perfil: Perfil };
  Detalhes: { orcamentoId: string };
  RotaDoDia: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function AppNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {token ? (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: false, title: 'Início' }}
            />
            <Stack.Screen
              name="Kanban"
              component={KanbanProducaoScreen}
              options={{ title: 'Kanban de Produção', headerShown: true }}
            />
            <Stack.Screen
              name="Detalhes"
              component={DetalhesOrcamentoScreen}
              options={{ title: 'Detalhes do Tapete', headerShown: true }}
            />
            <Stack.Screen
              name="RotaDoDia"
              component={RotaDoDiaScreen}
              options={{ title: 'Rota do Dia', headerShown: true }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
