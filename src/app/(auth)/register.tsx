import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { AppButton, AppInput, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { fieldErrors, registerSchema } from '@/lib/validation';
import type { AppDispatch } from '@/store';
import { startSession } from '@/store/auth-actions';
import { useRegisterMutation } from '@/store/authApi';
import { useAppTheme } from '@/theme';

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
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
    <AppScreen scrollable centered>
      <AppText variant="h1">
        Crear cuenta
      </AppText>
      <AppInput
        label="Nombre"
        value={form.name}
        onChangeText={set('name')}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AppInput
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
      <AppInput
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
      <AppInput
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
        <AppText variant="bodySmall" color={colors.error} accessibilityRole="alert">
          {formError}
        </AppText>
      ) : null}
      <AppButton title="Crear cuenta" onPress={submit} loading={isLoading} />
      <Link href="/login" style={styles.link}>
        <AppText color={colors.primary}>¿Ya tienes cuenta? Inicia sesión</AppText>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center', paddingVertical: 12 },
});
