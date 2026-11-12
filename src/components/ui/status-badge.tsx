import { StyleSheet, View } from 'react-native';

import { useAppTheme, type PaymentStatus } from '@/theme';
import { borderRadius, spacing } from '@/theme/spacing';

import { AppIcon, type AppIconName } from './app-icon';
import { AppText } from './app-text';

export const STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: AppIconName }> = {
  pending: { label: 'Pendiente', icon: 'clock' },
  markedPaid: { label: 'Marcado como pagado', icon: 'send' },
  confirmed: { label: 'Confirmado', icon: 'check-circle' },
  overdue: { label: 'Atrasado', icon: 'alert-triangle' },
  cancelled: { label: 'Cancelado', icon: 'x-circle' },
};

export interface StatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { colors } = useAppTheme();
  const { label, icon } = STATUS_CONFIG[status];
  const palette = colors.payment[status];
  const small = size === 'sm';

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border, paddingVertical: small ? 2 : spacing.xs },
      ]}>
      <AppIcon name={icon} size={small ? 14 : 16} color={palette.text} />
      <AppText variant={small ? 'caption' : 'bodySmall'} color={palette.text} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
  },
  text: { fontWeight: '600' },
});
