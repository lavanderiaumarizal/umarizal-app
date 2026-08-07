/**
 * screens/Login.tsx — Tela de login (F5)
 *
 * - Campos: usuário (email) + senha
 * - Checkbox "Manter conectado" → rememberMe: true (token 30 dias)
 * - Consome POST /api/auth/login
 * - Salva token no SecureStore + usuário no AsyncStorage
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, primaryGradient } from '../theme';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);

  async function handleLogin() {
    if (!email.trim() || !senha) {
      setErro('Informe usuário e senha');
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const res = await login(email.trim(), senha, rememberMe);
      if (!res?.token) {
        setErro('Resposta do servidor sem token (formato inesperado).');
        return;
      }
      await setSession(res.token, res.usuario);
    } catch (err: any) {
      const detalhe =
        err?.response?.data?.error?.message ||
        (err?.response?.status === 401
          ? 'Usuário ou senha inválidos'
          : err?.message || 'Erro desconhecido');
      setErro(`Não foi possível conectar: ${detalhe}`);
      console.error('[Login] erro:', JSON.stringify({ message: err?.message, status: err?.response?.status, data: err?.response?.data }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>LU</Text>
        </View>
        <Text style={styles.title}>Umarizal</Text>
        <Text style={styles.subtitle}>Logística Interna</Text>

        {/* Form */}
        <Text style={styles.label}>Usuário (email)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        {/* Manter conectado */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setRememberMe((v) => !v)}
          disabled={loading}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Manter conectado</Text>
        </TouchableOpacity>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: primaryGradient[1],
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  button: {
    backgroundColor: primaryGradient[1],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
