import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useAppTheme } from '@/theme';
import { borderRadius, spacing, touchable } from '@/theme/spacing';

export interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Obligatorio: describe el contenido completo de la tarjeta */
  accessibilityLabel: string;
  accessibilityHint?: string;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function AppCard({ children, onPress, accessibilityLabel, accessibilityHint, variant = 'elevated' }: AppCardProps) {
  const { colors } = useAppTheme();

  const variantStyle: ViewStyle = {
    elevated: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' } as ViewStyle,
    outlined: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 },
    filled: { backgroundColor: colors.primarySubtle, borderColor: 'transparent', borderWidth: 1 },
  }[variant];

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[styles.card, variantStyle]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.card, variantStyle, { opacity: pressed ? 0.85 : 1 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: touchable.minHeight, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm },
});
