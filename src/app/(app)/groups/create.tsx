import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppChip, AppInput, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { createGroupSchema, fieldErrors } from '@/lib/validation';
import { useCreateGroupMutation, useListServicesQuery } from '@/store/groupsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const EMPTY = {
  title: '',
  description: '',
  pricePerMember: '',
  paymentDay: '',
  slots: '',
  payoutMethod: '',
  payoutDetail: '',
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data: services, isLoading, error: servicesError, refetch } = useListServicesQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [serviceId, setServiceId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const service = services?.data.find((s) => s.id === serviceId);
  const set = (key: keyof typeof EMPTY) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setFormError(null);
    const parsed = createGroupSchema.safeParse({ serviceId, ...form });
    const found = parsed.success ? {} : fieldErrors(parsed.error);
    // Un cupo lo ocupa el administrador
    if (parsed.success && service && parsed.data.slots > service.maxMembers - 1) {
      found.slots = `Máximo ${service.maxMembers - 1} cupos para este servicio`;
    }
    setErrors(found);
    if (!parsed.success || Object.keys(found).length > 0) return;

    const result = await createGroup({ ...parsed.data, description: parsed.data.description || undefined });
    if (result.error) setFormError(getErrorMessage(result.error));
    else {
      haptics.success();
      router.replace(`/groups/${result.data.group.id}`);
    }
  };

  return (
    <AppScreen scrollable loading={isLoading} error={servicesError ? getErrorMessage(servicesError) : undefined} onRetry={refetch}>
      <AppText variant="h3">Servicio *</AppText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {services?.data.map((s) => (
          <AppChip key={s.id} label={s.name} selected={serviceId === s.id} onPress={() => setServiceId(s.id)} />
        ))}
      </View>
      {errors.serviceId ? (
        <AppText variant="bodySmall" color={colors.error} accessibilityRole="alert">
          {errors.serviceId}
        </AppText>
      ) : null}
      {service ? (
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Puedes ofrecer hasta {service.maxMembers - 1} cupos (el plan permite {service.maxMembers} personas contigo).
        </AppText>
      ) : null}

      <AppInput label="Título" required value={form.title} onChangeText={set('title')} error={errors.title} maxLength={80} />
      <AppInput
        label="Descripción"
        value={form.description}
        onChangeText={set('description')}
        error={errors.description}
        multiline
        maxLength={500}
      />
      <AppInput
        label="Precio por miembro (COP al mes)"
        required
        value={form.pricePerMember}
        onChangeText={set('pricePerMember')}
        error={errors.pricePerMember}
        keyboardType="number-pad"
      />
      <AppInput
        label="Día de pago del mes"
        required
        hint="Entre 1 y 28"
        value={form.paymentDay}
        onChangeText={set('paymentDay')}
        error={errors.paymentDay}
        keyboardType="number-pad"
      />
      <AppInput
        label="Cupos que ofreces"
        required
        value={form.slots}
        onChangeText={set('slots')}
        error={errors.slots}
        keyboardType="number-pad"
      />
      <AppInput
        label="Medio de pago"
        required
        hint="Ej: Nequi, Bancolombia"
        value={form.payoutMethod}
        onChangeText={set('payoutMethod')}
        error={errors.payoutMethod}
      />
      <AppInput
        label="Número o cuenta para recibir pagos"
        required
        hint="Solo lo verán los miembros aprobados"
        value={form.payoutDetail}
        onChangeText={set('payoutDetail')}
        error={errors.payoutDetail}
        autoCapitalize="none"
      />

      {formError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {formError}
        </AppText>
      ) : null}
      <AppButton title="Crear grupo" onPress={submit} loading={creating} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
