import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, STATUS_CONFIG, StatusBadge } from '@/components/ui';
import { formatCop } from '@/lib/format';
import { BADGE_STATUS, formatDueDate, periodTitle } from '@/lib/payments';
import type { Payment } from '@/store/paymentsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

export interface PaymentCardProps {
  payment: Payment;
  /** Muestra el nombre del miembro (vista del administrador) en vez del grupo */
  showMember?: boolean;
  onPress?: () => void;
}

export function PaymentCard({ payment, showMember, onPress }: PaymentCardProps) {
  const { colors } = useAppTheme();
  const badge = BADGE_STATUS[payment.status];
  const who = showMember ? payment.member.name : payment.group.title;
  const label = `${periodTitle(payment.period)}, ${who}. ${formatCop(payment.amount)}. ${STATUS_CONFIG[badge].label}. Vence el ${formatDueDate(payment.dueDate)}.`;

  return (
    <AppCard variant="outlined" onPress={onPress} accessibilityLabel={label} accessibilityHint={onPress ? 'Abre el detalle de la cuota' : undefined}>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText style={styles.title}>{periodTitle(payment.period)}</AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {who}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Vence el {formatDueDate(payment.dueDate)}
          </AppText>
        </View>
        <View style={styles.side}>
          <AppText variant="h3">{formatCop(payment.amount)}</AppText>
          <StatusBadge status={badge} size="sm" />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  info: { flex: 1 },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  title: { fontWeight: '600' },
});
