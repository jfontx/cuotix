import { forwardRef, useId, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme';
import { borderRadius, spacing, touchable } from '@/theme/spacing';
import { fontSize } from '@/theme/typography';

import { AppIcon } from './app-icon';
import { AppText } from './app-text';

export interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const AppInput = forwardRef<ComponentRef<typeof TextInput>, AppInputProps>(function AppInput(
  { label, error, hint, required, leftIcon, rightIcon, style, ...rest },
  ref,
) {
  const { colors } = useAppTheme();
  const id = useId();

  return (
    <View style={styles.field}>
      <AppText variant="bodySmall" style={styles.label} nativeID={`${id}-label`}>
        {label}
        {required ? ' *' : ''}
      </AppText>
      <View
        style={[
          styles.box,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border, borderWidth: error ? 2 : 1 },
        ]}>
        {leftIcon}
        <TextInput
          ref={ref}
          allowFontScaling
          accessibilityLabel={label + (required ? ', requerido' : '')}
          accessibilityHint={hint}
          aria-invalid={!!error}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {rightIcon}
      </View>
      {hint && !error ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <AppIcon name="error" size={16} color={colors.error} />
          <AppText variant="bodySmall" color={colors.error} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: '600' },
  box: {
    minHeight: touchable.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, minHeight: touchable.minHeight, fontSize: fontSize.base },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1 },
});
