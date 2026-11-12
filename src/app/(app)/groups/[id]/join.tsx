import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { formatCop, slotsLabel } from '@/lib/format';
import { useGetGroupQuery } from '@/store/groupsApi';
import { useJoinGroupMutation } from '@/store/membershipsApi';
import { useAppTheme } from '@/theme';

export default function JoinGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, error, refetch } = useGetGroupQuery(id);
  const [joinGroup, { isLoading: joining }] = useJoinGroupMutation();
  const [joinError, setJoinError] = useState<string | null>(null);

  const group = data?.group;

  const onJoin = async () => {
    setJoinError(null);
    const result = await joinGroup(id);
    if (result.error) {
      setJoinError(getErrorMessage(result.error));
      return;
    }
    haptics.success();
    router.replace(`/groups/${id}`);
  };

  return (
    <AppScreen scrollable loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {group ? (
        <>
          <AppText variant="h1">Solicitar unirme</AppText>
          <AppCard
            variant="filled"
            accessibilityLabel={`${group.service.name}, ${group.title}. ${formatCop(group.pricePerMember)} al mes. ${slotsLabel(group.availableSlots)}. Administra ${group.owner.name}.`}>
            <AppText variant="h3">{group.service.name}</AppText>
            <AppText>{group.title}</AppText>
            <AppText>{formatCop(group.pricePerMember)} / mes · pago el día {group.paymentDay}</AppText>
            <AppText>{slotsLabel(group.availableSlots)}</AppText>
            <AppText>Administra {group.owner.name}</AppText>
          </AppCard>

          <AppText color={colors.textSecondary}>
            Le enviaremos tu solicitud a {group.owner.name}. Si te aprueba, verás los datos de pago y deberás confirmar
            cuando tengas acceso al servicio.
          </AppText>

          {joinError ? (
            <AppText color={colors.error} accessibilityRole="alert">
              {joinError}
            </AppText>
          ) : null}

          <AppButton title="Enviar solicitud" loading={joining} onPress={onJoin} />
          <AppButton title="Cancelar" variant="outline" onPress={() => router.back()} />
        </>
      ) : null}
    </AppScreen>
  );
}
