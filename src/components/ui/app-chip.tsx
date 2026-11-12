import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme';
import { borderRadius, spacing, touchable } from '@/theme/spacing';

import { AppText } from './app-text';

export interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  /** Ancho fijo: con varios chips en fila, todos miden lo mismo y el texto largo pasa a una segunda línea */
  width?: number;
}

/** Filtro/etiqueta seleccionable; el estado se comunica con `accessibilityState.selected`, no solo con color. */
export function AppChip({ label, selected = false, onPress, accessibilityHint, width }: AppChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      hitSlop={touchable.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        width !== undefined && { width },
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <AppText
        variant="bodySmall"
        color={selected ? colors.onPrimary : colors.text}
        style={styles.label}
        numberOfLines={width !== undefined ? 2 : undefined}>
        {selected ? `✓ ${label}` : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchable.minHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: { fontWeight: '600', textAlign: 'center' },
});
