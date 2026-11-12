import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { AppAvatar, AppButton, AppCard, AppChip, AppInput, AppModal, AppScreen, AppSwitch, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { fieldErrors, profileSchema } from '@/lib/validation';
import type { AppDispatch } from '@/store';
import { logout } from '@/store/auth-actions';
import { selectCurrentUser, setUser } from '@/store/authSlice';
import { useUpdateMeMutation } from '@/store/authApi';
import { useGetUserRatingsQuery } from '@/store/ratingsApi';
import { selectSettings, setHaptics, setHighContrast, setTheme, type ThemePreference } from '@/store/settingsSlice';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

function memberSince(iso: string) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d = new Date(iso);
  return `Desde ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useSelector(selectCurrentUser);
  const settings = useSelector(selectSettings);
  const { data: ratings } = useGetUserRatingsQuery(user?.id ?? '', { skip: !user });
  const [updateMe, updating] = useUpdateMeMutation();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (!user) return <AppScreen title="Perfil" loading>{null}</AppScreen>;

  const openEdit = () => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setErrors({});
    setServerError(null);
    setEditing(true);
  };

  const save = async () => {
    const parsed = profileSchema.safeParse({ name, phone });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      haptics.error();
      return;
    }
    setErrors({});
    setServerError(null);
    const result = await updateMe({ name: parsed.data.name, phone: parsed.data.phone || null });
    if ('error' in result) {
      setServerError(getErrorMessage(result.error));
      haptics.error();
      return;
    }
    dispatch(setUser(result.data.user));
    haptics.success();
    setEditing(false);
  };

  const summary = ratings?.average != null ? `★ ${ratings.average.toFixed(1)} · ${ratings.count} calificaciones` : 'Sin calificaciones aún';

  return (
    <AppScreen title="Perfil" scrollable>
      <AppCard variant="filled" accessibilityLabel={`${user.name}. ${summary}. ${memberSince(user.createdAt)}.`}>
        <View style={styles.header}>
          <AppAvatar name={user.name} size={56} />
          <View style={styles.flex}>
            <AppText variant="h3">{user.name}</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {user.email}
            </AppText>
            <AppText variant="bodySmall">{summary}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {memberSince(user.createdAt)}
            </AppText>
          </View>
        </View>
      </AppCard>

      <AppText variant="h2">Configuración</AppText>
      <View style={styles.section}>
        <AppText>Tema</AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {THEMES.map((t) => (
            <AppChip key={t.value} label={t.label} selected={settings.theme === t.value} onPress={() => dispatch(setTheme(t.value))} />
          ))}
        </View>
        <AppSwitch
          label="Alto contraste"
          description="Colores con mayor contraste para leer mejor"
          value={settings.highContrast}
          onValueChange={(v) => dispatch(setHighContrast(v))}
        />
        <AppSwitch
          label="Vibración"
          description="Respuesta háptica al realizar acciones"
          value={settings.haptics}
          onValueChange={(v) => dispatch(setHaptics(v))}
        />
      </View>

      <AppText variant="h2">Cuenta</AppText>
      <View style={styles.section}>
        <AppButton title="Editar perfil" variant="outline" onPress={openEdit} />
        <AppButton title="Mis calificaciones" variant="outline" onPress={() => router.push(`/users/${user.id}`)} />
        <AppButton title="Mis cuotas" variant="outline" onPress={() => router.push('/payments')} />
        <AppButton title="Cerrar sesión" variant="danger" onPress={() => dispatch(logout())} />
      </View>

      <AppModal visible={editing} onClose={() => setEditing(false)} title="Editar perfil">
        <AppInput label="Nombre" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
        <AppInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          hint="Opcional"
          keyboardType="phone-pad"
        />
        {serverError ? (
          <AppText color={colors.error} accessibilityRole="alert">
            {serverError}
          </AppText>
        ) : null}
        <AppButton title="Guardar cambios" loading={updating.isLoading} onPress={save} />
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
