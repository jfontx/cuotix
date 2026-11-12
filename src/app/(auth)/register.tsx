import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { AuthButton, AuthField, ERROR } from '@/components/auth/auth-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api-error';
import { fieldErrors, registerSchema } from '@/lib/validation';
import type { AppDispatch } from '@/store';
import { startSession } from '@/store/auth-actions';
import { useRegisterMutation } from '@/store/authApi';

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setFormError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const { phone, ...rest } = parsed.data;
    const result = await register(phone ? { ...rest, phone } : rest);
    if (result.error) setFormError(getErrorMessage(result.error));
    else await dispatch(startSession(result.data));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle" accessibilityRole="header">
              Crear cuenta
            </ThemedText>
            <AuthField
              label="Nombre"
              value={form.name}
              onChangeText={set('name')}
              error={errors.name}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <AuthField
              ref={emailRef}
              label="Correo"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <AuthField
              ref={phoneRef}
              label="Teléfono (opcional)"
              value={form.phone}
              onChangeText={set('phone')}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <AuthField
              ref={passwordRef}
              label="Contraseña"
              value={form.password}
              onChangeText={set('password')}
              error={errors.password}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            {formError ? (
              <ThemedText type="small" style={{ color: ERROR }} accessibilityRole="alert">
                {formError}
              </ThemedText>
            ) : null}
            <AuthButton title="Crear cuenta" onPress={submit} loading={isLoading} />
            <Link href="/login" style={styles.link}>
              <ThemedText type="linkPrimary">¿Ya tienes cuenta? Inicia sesión</ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  link: { alignSelf: 'center', paddingVertical: Spacing.two },
});
