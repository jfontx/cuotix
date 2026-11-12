import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { AppButton, AppCard, AppDivider, AppInput, AppModal, AppScreen, AppText, StatusBadge } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { formatCop } from '@/lib/format';
import { BADGE_STATUS, formatDueDate, isPayable, periodTitle } from '@/lib/payments';
import { selectCurrentUser } from '@/store/authSlice';
import { useConfirmPaymentMutation, useGetPaymentQuery, useRejectPaymentMutation } from '@/store/paymentsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const MIN_REASON = 10;

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isFetching, error, refetch } = useGetPaymentQuery(id);
  const [confirm, confirming] = useConfirmPaymentMutation();
  const [reject, rejecting] = useRejectPaymentMutation();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);

  const payment = data?.payment;
  const isPayer = !!payment && payment.member.id === user?.id;

  const run = async (action: () => Promise<{ error?: unknown }>) => {
    setActionError(null);
    const result = await action();
    if (result.error) setActionError(getErrorMessage(result.error as Parameters<typeof getErrorMessage>[0]));
    if (result.error) haptics.error();
    else haptics.success();
    return !result.error;
  };

  const closeReject = () => {
    setRejectOpen(false);
    setReason('');
    setFieldError(undefined);
  };

  const onReject = async () => {
    const text = reason.trim();
    if (text.length < MIN_REASON) {
      setFieldError(`Escribe al menos ${MIN_REASON} caracteres para que el miembro entienda el motivo`);
      return;
    }
    if (await run(() => reject({ id, reason: text }))) closeReject();
  };

  return (
    <AppScreen scrollable refreshing={isFetching && !isLoading} onRefresh={refetch} loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {payment ? (
        <>
          <AppText variant="h1">{periodTitle(payment.period)}</AppText>
          <AppText color={colors.textSecondary}>
            {payment.group.title} · {payment.group.service.name}
          </AppText>

          <AppCard
            variant="filled"
            accessibilityLabel={`${formatCop(payment.amount)} pesos colombianos. Vence el ${formatDueDate(payment.dueDate)}.`}>
            <AppText variant="h2">{formatCop(payment.amount)}</AppText>
            <AppText>COP</AppText>
            <StatusBadge status={BADGE_STATUS[payment.status]} />
            <AppText>Vence el {formatDueDate(payment.dueDate)}</AppText>
          </AppCard>

          {!isPayer ? <AppText>Miembro: {payment.member.name}</AppText> : null}

          {payment.status === 'PENDING' && payment.rejectionReason ? (
            <AppText color={colors.error} accessibilityRole="alert">
              El administrador rechazó tu pago anterior: {payment.rejectionReason}
            </AppText>
          ) : null}

          {payment.reference ? <AppText>Referencia: {payment.reference}</AppText> : null}

          {payment.payoutDetail ? (
            <>
              <AppDivider />
              <AppText variant="h3">Datos de pago</AppText>
              <AppCard
                variant="outlined"
                accessibilityLabel={`Medio de pago ${payment.group.payoutMethod}: ${payment.payoutDetail}`}>
                <AppText style={styles.bold}>{payment.group.payoutMethod}</AppText>
                <AppText selectable>{payment.payoutDetail}</AppText>
              </AppCard>
            </>
          ) : null}

          {actionError ? (
            <AppText color={colors.error} accessibilityRole="alert">
              {actionError}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            {isPayer && isPayable(payment.status) ? (
              <AppButton
                title="Ya pagué"
                accessibilityHint="Abre la pantalla para avisar al administrador que hiciste el pago"
                onPress={() => router.push({ pathname: '/payments/mark-paid', params: { id } })}
              />
            ) : null}
            {isPayer && payment.status === 'MARKED_PAID' ? (
              <AppText color={colors.textSecondary}>Esperando que el administrador confirme tu pago.</AppText>
            ) : null}
            {!isPayer && payment.status === 'MARKED_PAID' ? (
              <>
                <AppButton
                  title="Confirmar pago"
                  loading={confirming.isLoading}
                  accessibilityHint={`Confirma que recibiste el pago de ${payment.member.name}`}
                  onPress={() => run(() => confirm(id))}
                />
                <AppButton
                  title="Rechazar pago"
                  variant="outline"
                  accessibilityHint="Pide un motivo y devuelve la cuota a pendiente"
                  onPress={() => setRejectOpen(true)}
                />
              </>
            ) : null}
          </View>

          <AppModal visible={rejectOpen} onClose={closeReject} title="Rechazar pago">
            <AppText>
              La cuota volverá a pendiente y {payment.member.name} verá el motivo que escribas.
            </AppText>
            <AppInput
              label="Motivo"
              required
              value={reason}
              onChangeText={setReason}
              maxLength={200}
              multiline
              error={fieldError}
            />
            <AppButton title="Rechazar pago" variant="danger" loading={rejecting.isLoading} onPress={onReject} />
            <AppButton title="Cancelar" variant="outline" onPress={closeReject} />
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
