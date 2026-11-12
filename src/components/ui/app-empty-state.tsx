import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

import { AppButton } from './app-button';
import { AppIcon, type AppIconName } from './app-icon';
import { AppText } from './app-text';

export interface AppEmptyStateProps {
  title: string;
  message?: string;
  icon?: AppIconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function AppEmptyState({ title, message, icon = 'info', actionLabel, onAction }: AppEmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.root} accessible accessibilityLabel={message ? `${title}. ${message}` : title}>
      <AppIcon name={icon} size={32} color={colors.textSecondary} />
      <AppText variant="h3" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.textSecondary} style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} variant="outline" fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  center: { textAlign: 'center' },
});
