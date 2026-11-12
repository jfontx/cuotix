import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppAvatar, AppCard, AppText } from '@/components/ui';
import { formatCop } from '@/lib/format';
import type { MembershipStatus } from '@/store/groupsApi';
import type { Member } from '@/store/membershipsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

export const MEMBER_STATUS_LABEL: Partial<Record<MembershipStatus, string>> = {
  PENDING: 'Solicitud pendiente',
  APPROVED: 'Aprobado, falta confirmar acceso',
  ACTIVE: 'Miembro activo',
};

export interface MemberCardProps {
  member: Member;
  /** Botones de acción; van fuera de la tarjeta para que los lectores de pantalla los alcancen */
  actions?: ReactNode;
}

export function MemberCard({ member, actions }: MemberCardProps) {
  const { colors } = useAppTheme();
  const status = MEMBER_STATUS_LABEL[member.status] ?? member.status;
  const amount = member.firstAmount ? `Primera cuota de ${formatCop(member.firstAmount)}` : null;
  const label = [member.user.name, status, amount].filter(Boolean).join('. ');

  return (
    <View style={styles.wrapper}>
      <AppCard variant="outlined" accessibilityLabel={label}>
        <View style={styles.row}>
          <AppAvatar name={member.user.name} />
          <View style={styles.info}>
            <AppText style={styles.name}>{member.user.name}</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {status}
            </AppText>
            {amount ? (
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {amount}
              </AppText>
            ) : null}
          </View>
        </View>
      </AppCard>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  name: { fontWeight: '600' },
  actions: { gap: spacing.sm },
});
