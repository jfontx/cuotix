import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useAppTheme } from '@/theme';
import { borderRadius, spacing, touchable } from '@/theme/spacing';

import { AppText } from './app-text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const MIN_HEIGHT: Record<ButtonSize, number> = { sm: touchable.minHeight, md: touchable.minHeight, lg: 56 };

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  accessibilityHint,
  style,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.secondary, fg: '#1C1917', border: colors.secondary },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.error, fg: colors.background, border: colors.error },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={touchable.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: MIN_HEIGHT[size],
          minWidth: touchable.minWidth,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}>
      <View style={[styles.row, iconPosition === 'right' && styles.rowReverse]}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon}
        <AppText variant="button" color={palette.fg}>
          {loading ? 'Cargando…' : title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowReverse: { flexDirection: 'row-reverse' },
});
