import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppCard, AppInput, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { formatCop } from '@/lib/format';
import { formatDueDate, isPayable, periodTitle } from '@/lib/payments';
import { useGetPaymentQuery, useMarkPaidMutation } from '@/store/paymentsApi';
import { useAppTheme } from '@/theme';

export default function MarkPaidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, error, refetch } = useGetPaymentQuery(id);
  const [markPaid, marking] = useMarkPaidMutation();
  const [reference, setReference] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payment = data?.payment;

  const onSubmit = async () => {
    setSubmitError(null);
    const text = reference.trim();
    const result = await markPaid({ id, reference: text || undefined });
    if (result.error) setSubmitError(getErrorMessage(result.error));
    else {
      haptics.success();
      router.back();
    }
  };

  return (
    <AppScreen scrollable loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {payment ? (
        <>
          <AppCard
            variant="filled"
            accessibilityLabel={`${periodTitle(payment.period)}, ${formatCop(payment.amount)}. Vence el ${formatDueDate(payment.dueDate)}.`}>
            <AppText variant="h2">{formatCop(payment.amount)}</AppText>
            <AppText>
              {periodTitle(payment.period)} · {payment.group.title}
            </AppText>
            <AppText>Vence el {formatDueDate(payment.dueDate)}</AppText>
          </AppCard>

          {isPayable(payment.status) ? (
            <>
              <AppText>
                Paga por {payment.group.payoutMethod} a {payment.payoutDetail} y avisa al administrador. Él confirmará
                que recibió el dinero.
              </AppText>
              <AppInput
                label="Referencia (opcional)"
                hint="Por ejemplo, los últimos 4 dígitos del comprobante"
                value={reference}
                onChangeText={setReference}
                maxLength={100}
              />
              {submitError ? (
                <AppText color={colors.error} accessibilityRole="alert">
                  {submitError}
                </AppText>
              ) : null}
              <AppButton title="Ya pagué" loading={marking.isLoading} onPress={onSubmit} />
              <AppButton title="Cancelar" variant="outline" onPress={() => router.back()} />
            </>
          ) : (
            <>
              <AppText>Esta cuota ya no se puede marcar como pagada.</AppText>
              <AppButton title="Volver" variant="outline" onPress={() => router.back()} />
            </>
          )}
        </>
      ) : null}
    </AppScreen>
  );
}
