import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppDivider, AppModal, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { formatCop, slotsLabel } from '@/lib/format';
import type { GroupDetail } from '@/store/groupsApi';
import { useCloseGroupMutation, useGetGroupQuery, useUpdateGroupMutation } from '@/store/groupsApi';
import { useConfirmAccessMutation, useLeaveMembershipMutation } from '@/store/membershipsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const STATUS_LABEL = { OPEN: 'Abierto', FULL: 'Completo', PAUSED: 'Pausado', CLOSED: 'Cerrado' } as const;
const MEMBERSHIP_LABEL = {
  PENDING: 'Solicitud pendiente de aprobación',
  APPROVED: 'Aprobado: falta confirmar el acceso',
  ACTIVE: 'Eres miembro activo',
  REJECTED: 'Solicitud rechazada',
  LEFT: 'Saliste del grupo',
  REMOVED: 'Fuiste removido del grupo',
} as const;

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, error, refetch } = useGetGroupQuery(id);
  const [closeGroup, closing] = useCloseGroupMutation();
  const [updateGroup, updating] = useUpdateGroupMutation();
  const [confirmAccess, confirming] = useConfirmAccessMutation();
  const [leaveMembership, leaving] = useLeaveMembershipMutation();
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const group = data?.group;

  const run = async (action: () => Promise<{ error?: unknown }>) => {
    setActionError(null);
    const result = await action();
    if (result.error) setActionError(getErrorMessage(result.error as Parameters<typeof getErrorMessage>[0]));
    return !result.error;
  };

  const onClose = async () => {
    await run(() => closeGroup(id));
    setConfirmClose(false);
  };

  const onLeave = async () => {
    if (group?.myMembership) await run(() => leaveMembership({ id: group.myMembership!.id, groupId: id }));
    setConfirmLeave(false);
  };

  const membershipActions = (group: GroupDetail) => {
    const mine = group.myMembership;
    const canRequest = !group.isOwner && (!mine || mine.status === 'REJECTED') && group.status === 'OPEN';
    const isMember = mine?.status === 'APPROVED' || mine?.status === 'ACTIVE';
    return (
      <View style={styles.actions}>
        {canRequest ? (
          <AppButton
            title="Solicitar unirme"
            accessibilityHint="Abre la pantalla para enviar tu solicitud al administrador"
            onPress={() => router.push(`/groups/${id}/join`)}
          />
        ) : null}
        {mine?.status === 'APPROVED' ? (
          <AppButton
            title="Ya tengo acceso al servicio"
            loading={confirming.isLoading}
            accessibilityHint="Confirma que el administrador te dio acceso y genera tu primera cuota"
            onPress={() => run(() => confirmAccess({ id: mine.id, groupId: id }))}
          />
        ) : null}
        {group.isOwner || isMember ? (
          <AppButton
            title={group.isOwner ? 'Miembros y solicitudes' : 'Ver miembros'}
            variant="outline"
            onPress={() => router.push(`/groups/${id}/members`)}
          />
        ) : null}
        {group.isOwner || mine?.status === 'ACTIVE' ? (
          <AppButton
            title={group.isOwner ? 'Cuotas del grupo' : 'Mis cuotas del grupo'}
            variant="outline"
            onPress={() => router.push(`/groups/${id}/payments`)}
          />
        ) : null}
        {!group.isOwner && mine && ['ACTIVE', 'LEFT'].includes(mine.status) ? (
          <AppButton
            title={`Perfil de ${group.owner.name}`}
            variant="outline"
            accessibilityHint="Abre el perfil del administrador, donde puedes calificarlo o reportarlo"
            onPress={() => router.push({ pathname: '/users/[id]', params: { id: group.owner.id, groupId: id } })}
          />
        ) : null}
        {isMember ? <AppButton title="Salir del grupo" variant="ghost" onPress={() => setConfirmLeave(true)} /> : null}
      </View>
    );
  };

  return (
    <AppScreen scrollable loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {group ? (
        <>
          <AppText variant="h1">{group.title}</AppText>
          <AppText color={colors.textSecondary}>
            {group.service.name} · {STATUS_LABEL[group.status]}
          </AppText>

          <AppCard
            variant="filled"
            accessibilityLabel={`${formatCop(group.pricePerMember)} al mes. ${slotsLabel(group.availableSlots)}. Pago el día ${group.paymentDay} de cada mes. Administra ${group.owner.name}.`}>
            <AppText variant="h2">{formatCop(group.pricePerMember)} / mes</AppText>
            <AppText>{slotsLabel(group.availableSlots)}</AppText>
            <AppText>Pago el día {group.paymentDay} de cada mes</AppText>
            <AppText>Administra {group.owner.name}</AppText>
          </AppCard>

          {group.description ? <AppText>{group.description}</AppText> : null}

          {group.myMembership ? (
            <AppText accessibilityRole="text" style={styles.bold}>
              {MEMBERSHIP_LABEL[group.myMembership.status]}
            </AppText>
          ) : null}

          <AppDivider />
          <AppText variant="h3">Sobre el servicio</AppText>
          <AppText color={colors.textSecondary}>
            {group.service.allowsOutOfHome
              ? 'Los miembros pueden estar en otra ubicación.'
              : 'Todos los miembros deben vivir en el mismo hogar.'}
          </AppText>
          {group.service.notes ? <AppText color={colors.textSecondary}>{group.service.notes}</AppText> : null}

          <AppDivider />
          <AppText variant="h3">Datos de pago</AppText>
          {group.payoutDetail ? (
            <AppCard variant="outlined" accessibilityLabel={`Medio de pago ${group.payoutMethod}: ${group.payoutDetail}`}>
              <AppText style={styles.bold}>{group.payoutMethod}</AppText>
              <AppText selectable>{group.payoutDetail}</AppText>
            </AppCard>
          ) : (
            <AppText color={colors.textSecondary}>
              Los datos de pago se muestran cuando el administrador aprueba tu solicitud.
            </AppText>
          )}

          {actionError ? (
            <AppText color={colors.error} accessibilityRole="alert">
              {actionError}
            </AppText>
          ) : null}

          {membershipActions(group)}

          {group.isOwner && group.status !== 'CLOSED' ? (
            <View style={styles.actions}>
              <AppButton
                title={group.status === 'PAUSED' ? 'Reabrir grupo' : 'Pausar grupo'}
                variant="outline"
                loading={updating.isLoading}
                accessibilityHint={
                  group.status === 'PAUSED' ? 'El grupo volverá a aceptar solicitudes' : 'El grupo dejará de aceptar solicitudes'
                }
                onPress={() =>
                  run(() => updateGroup({ id, changes: { status: group.status === 'PAUSED' ? 'OPEN' : 'PAUSED' } }))
                }
              />
              <AppButton title="Cerrar grupo" variant="danger" onPress={() => setConfirmClose(true)} />
            </View>
          ) : null}

          <AppModal visible={confirmLeave} onClose={() => setConfirmLeave(false)} title="¿Salir del grupo?">
            <AppText>
              Dejarás de ser parte del grupo y se cancelarán tus cuotas de los ciclos siguientes. Para volver a entrar
              tendrías que pedirle ayuda al administrador.
            </AppText>
            <AppButton title="Sí, salir del grupo" variant="danger" loading={leaving.isLoading} onPress={onLeave} />
            <AppButton title="Cancelar" variant="outline" onPress={() => setConfirmLeave(false)} />
          </AppModal>

          <AppModal visible={confirmClose} onClose={() => setConfirmClose(false)} title="¿Cerrar el grupo?">
            <AppText>
              El grupo dejará de estar disponible y las cuotas pendientes se cancelarán. Esta acción no se puede deshacer.
            </AppText>
            <AppButton title="Sí, cerrar grupo" variant="danger" loading={closing.isLoading} onPress={onClose} />
            <AppButton title="Cancelar" variant="outline" onPress={() => setConfirmClose(false)} />
          </AppModal>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
