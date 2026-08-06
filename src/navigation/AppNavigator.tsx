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

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
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
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false, title: 'Início' }}
          />
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
