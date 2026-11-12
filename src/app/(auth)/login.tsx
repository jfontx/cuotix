import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { AppButton, AppInput, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { fieldErrors, loginSchema } from '@/lib/validation';
import type { AppDispatch } from '@/store';
import { startSession } from '@/store/auth-actions';
import { useLoginMutation } from '@/store/authApi';
import { useAppTheme } from '@/theme';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const result = await login(parsed.data);
    if (result.error) setFormError(getErrorMessage(result.error));
    else await dispatch(startSession(result.data));
  };

  return (
    <AppScreen scrollable centered>
      <AppText variant="h1">Iniciar sesión</AppText>
      <AppInput
        label="Correo"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AppInput
        ref={passwordRef}
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {formError ? (
        <AppText variant="bodySmall" color={colors.error} accessibilityRole="alert">
          {formError}
        </AppText>
      ) : null}
      <AppButton title="Iniciar sesión" onPress={submit} loading={isLoading} />
      <Link href="/register" style={styles.link}>
        <AppText color={colors.primary}>¿No tienes cuenta? Regístrate</AppText>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center', paddingVertical: 12 },
});
