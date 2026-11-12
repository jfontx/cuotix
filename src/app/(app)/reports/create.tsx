import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppChip, AppInput, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { useCreateReportMutation } from '@/store/ratingsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

export const REPORT_REASONS = [
  'No dio acceso al servicio',
  'No pagó la cuota',
  'Comportamiento ofensivo',
  'Cobro indebido',
  'Otro',
] as const;

export default function ReportUserScreen() {
  const { reportedId, groupId, name } = useLocalSearchParams<{ reportedId: string; groupId: string; name?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [createReport, { isLoading }] = useCreateReportMutation();
  const [reason, setReason] = useState<string>('');
  const [detail, setDetail] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setSubmitError(null);
    if (!reason) {
      setReasonError('Elige un motivo');
      return;
    }
    setReasonError(undefined);
    const text = detail.trim();
    const result = await createReport({ groupId, reportedId, reason, detail: text || undefined });
    if (result.error) setSubmitError(getErrorMessage(result.error));
    else setSent(true);
  };

  if (sent) {
    return (
      <AppScreen scrollable>
        <AppText variant="h2">Reporte enviado</AppText>
        <AppText>Gracias. Un moderador revisará lo ocurrido.</AppText>
        <AppButton title="Volver" onPress={() => router.back()} />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable>
      <AppText variant="h2">{name ? `Reportar a ${name}` : 'Reportar usuario'}</AppText>
      <AppText color={colors.textSecondary}>Cuéntanos qué pasó. Solo el equipo de moderación verá este reporte.</AppText>

      <AppText variant="h3">Motivo</AppText>
      <View style={styles.chips}>
        {REPORT_REASONS.map((r) => (
          <AppChip key={r} label={r} selected={reason === r} onPress={() => { setReason(r); setReasonError(undefined); }} />
        ))}
      </View>
      {reasonError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {reasonError}
        </AppText>
      ) : null}

      <AppInput label="Detalles (opcional)" value={detail} onChangeText={setDetail} maxLength={500} multiline />

      {submitError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {submitError}
        </AppText>
      ) : null}
      <AppButton title="Enviar reporte" variant="danger" loading={isLoading} onPress={onSubmit} />
      <AppButton title="Cancelar" variant="outline" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
