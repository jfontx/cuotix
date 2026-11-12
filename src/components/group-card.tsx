import { StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components/ui';
import { formatCop, slotsLabel } from '@/lib/format';
import type { GroupStatus, GroupSummary } from '@/store/groupsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const STATUS_LABEL: Partial<Record<GroupStatus, string>> = {
  FULL: 'Completo',
  PAUSED: 'Pausado',
  CLOSED: 'Cerrado',
};

export interface GroupCardProps {
  group: GroupSummary;
  onPress: () => void;
  /** Muestra al administrador (útil al explorar) */
  showOwner?: boolean;
}

export function GroupCard({ group, onPress, showOwner = true }: GroupCardProps) {
  const { colors } = useAppTheme();
  const price = `${formatCop(group.pricePerMember)} al mes`;
  const slots = slotsLabel(group.availableSlots);
  const status = STATUS_LABEL[group.status];

  const label = [
    group.service.name,
    group.title,
    price,
    slots,
    showOwner ? `Administrador ${group.owner.name}` : null,
    status ? `Estado: ${status}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <AppCard onPress={onPress} accessibilityLabel={label} accessibilityHint="Abre el detalle del grupo">
      <AppText variant="h3">{group.service.name}</AppText>
      <AppText color={colors.textSecondary}>{group.title}</AppText>
      <View style={styles.row}>
        <AppText style={styles.price}>{price}</AppText>
        <AppText variant="bodySmall" color={group.availableSlots > 0 ? colors.primary : colors.textSecondary}>
          {slots}
        </AppText>
      </View>
      {showOwner || status ? (
        <View style={styles.row}>
          {showOwner ? (
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Administra {group.owner.name}
            </AppText>
          ) : (
            <View />
          )}
          {status ? (
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.price}>
              {status}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  price: { fontWeight: '600' },
});
