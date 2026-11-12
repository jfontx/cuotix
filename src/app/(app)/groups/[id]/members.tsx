import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MemberCard } from '@/components/member-card';
import { AppButton, AppDivider, AppEmptyState, AppInput, AppModal, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { formatCop } from '@/lib/format';
import { useGetGroupQuery } from '@/store/groupsApi';
import {
  useApproveMembershipMutation,
  useListMembersQuery,
  useRejectMembershipMutation,
  useRemoveMemberMutation,
  type Member,
} from '@/store/membershipsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

type Dialog = { kind: 'approve' | 'remove'; member: Member } | null;

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const group = useGetGroupQuery(id).data?.group;
  const { data, isLoading, error, refetch } = useListMembersQuery(id);
  const [approve, approving] = useApproveMembershipMutation();
  const [reject, rejecting] = useRejectMembershipMutation();
  const [remove, removing] = useRemoveMemberMutation();

  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner = !!group?.isOwner;
  const members = data?.data ?? [];
  const pending = members.filter((m) => m.status === 'PENDING');
  const approved = members.filter((m) => m.status === 'APPROVED');
  const active = members.filter((m) => m.status === 'ACTIVE');

  const closeDialog = () => {
    setDialog(null);
    setAmount('');
    setReason('');
    setFieldError(undefined);
  };

  const run = async (action: () => Promise<{ error?: unknown }>) => {
    setActionError(null);
    const result = await action();
    if (result.error) setActionError(getErrorMessage(result.error as Parameters<typeof getErrorMessage>[0]));
    return !result.error;
  };

  const onApprove = async () => {
    if (dialog?.kind !== 'approve') return;
    const trimmed = amount.trim();
    if (trimmed && !/^\d+$/.test(trimmed)) {
      setFieldError('Ingresa solo números');
      return;
    }
    const firstAmount = trimmed ? Number(trimmed) : undefined;
    if (firstAmount !== undefined && (firstAmount < 1 || firstAmount > 10_000_000)) {
      setFieldError('El monto debe estar entre $1 y $10.000.000');
      return;
    }
    const memberId = dialog.member.id;
    closeDialog();
    await run(() => approve({ id: memberId, groupId: id, firstAmount }));
  };

  const onRemove = async () => {
    if (dialog?.kind !== 'remove') return;
    const memberId = dialog.member.id;
    const text = reason.trim();
    closeDialog();
    await run(() => remove({ id: memberId, groupId: id, reason: text || undefined }));
  };

  const profileButton = (m: Member) => (
    <AppButton
      title="Ver perfil"
      variant="ghost"
      accessibilityHint={`Abre el perfil y las calificaciones de ${m.user.name}`}
      onPress={() => router.push({ pathname: '/users/[id]', params: { id: m.user.id, groupId: id } })}
    />
  );

  const section = (title: string, list: Member[], actions?: (m: Member) => React.ReactNode) =>
    list.length ? (
      <View style={styles.section}>
        <AppText variant="h3">
          {title} ({list.length})
        </AppText>
        {list.map((m) => (
          <MemberCard key={m.id} member={m} actions={actions?.(m)} />
        ))}
      </View>
    ) : null;

  return (
    <AppScreen scrollable loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {group ? (
        <AppText color={colors.textSecondary}>
          {group.title} · {group.occupiedSlots} de {group.slots} cupos ocupados
        </AppText>
      ) : null}

      {actionError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {actionError}
        </AppText>
      ) : null}

      {members.length === 0 ? (
        <AppEmptyState
          title="Aún no hay miembros"
          message={isOwner ? 'Cuando alguien pida unirse, verás su solicitud aquí.' : 'Todavía no hay otros miembros.'}
          icon="info"
        />
      ) : null}

      {isOwner
        ? section('Solicitudes', pending, (m) => (
            <>
              {profileButton(m)}
              <AppButton
                title="Aprobar"
                accessibilityHint={`Aprueba la solicitud de ${m.user.name}`}
                loading={approving.isLoading}
                onPress={() => setDialog({ kind: 'approve', member: m })}
              />
              <AppButton
                title="Rechazar"
                variant="outline"
                accessibilityHint={`Rechaza la solicitud de ${m.user.name}`}
                loading={rejecting.isLoading}
                onPress={() => run(() => reject({ id: m.id, groupId: id }))}
              />
            </>
          ))
        : null}
      {section('Esperando confirmar acceso', approved, profileButton)}
      {active.length && (pending.length || approved.length) ? <AppDivider /> : null}
      {section(
        'Miembros activos',
        active,
        (m) => (
          <>
            {profileButton(m)}
            {isOwner ? (
              <AppButton
                title="Expulsar"
                variant="ghost"
                accessibilityHint={`Expulsa a ${m.user.name}; solo es posible con 2 cuotas vencidas seguidas`}
                onPress={() => setDialog({ kind: 'remove', member: m })}
              />
            ) : null}
          </>
        ),
      )}

      <AppModal
        visible={dialog?.kind === 'approve'}
        onClose={closeDialog}
        title={dialog ? `Aprobar a ${dialog.member.user.name}` : 'Aprobar'}>
        <AppText>
          Por defecto pagará {group ? formatCop(group.pricePerMember) : 'el precio del grupo'} como primera cuota. Si
          acordaron otro monto, escríbelo aquí.
        </AppText>
        <AppInput
          label="Monto de la primera cuota (opcional)"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          error={fieldError}
        />
        <AppButton title="Aprobar solicitud" loading={approving.isLoading} onPress={onApprove} />
        <AppButton title="Cancelar" variant="outline" onPress={closeDialog} />
      </AppModal>

      <AppModal
        visible={dialog?.kind === 'remove'}
        onClose={closeDialog}
        title={dialog ? `Expulsar a ${dialog.member.user.name}` : 'Expulsar'}>
        <AppText>
          Solo puedes expulsar a quien tenga 2 cuotas vencidas seguidas. Se cancelarán sus cuotas pendientes y se
          liberará su cupo.
        </AppText>
        <AppInput label="Motivo (opcional)" value={reason} onChangeText={setReason} maxLength={200} />
        <AppButton title="Sí, expulsar" variant="danger" loading={removing.isLoading} onPress={onRemove} />
        <AppButton title="Cancelar" variant="outline" onPress={closeDialog} />
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ section: { gap: spacing.md } });
