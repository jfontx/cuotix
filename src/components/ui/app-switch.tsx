import { StyleSheet, Switch, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme';
import { spacing, touchable } from '@/theme/spacing';

import { AppText } from './app-text';

export interface AppSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
}

/** Fila con interruptor: la fila completa mide ≥48dp y el estado se anuncia con el rol `switch`. */
export function AppSwitch({ label, value, onValueChange, description }: AppSwitchProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText>{label}</AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={(v) => {
          haptics.select();
          onValueChange(v);
        }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: touchable.minHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1 },
});
