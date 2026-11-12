import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './app-text';

export interface AppAvatarProps {
  name: string;
  size?: number;
}

/** Iniciales sobre un círculo. Es decorativo: el nombre siempre se lee en el texto vecino. */
export function AppAvatar({ name, size = 44 }: AppAvatarProps) {
  const { colors } = useAppTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySubtle }]}>
      <AppText variant="bodySmall" color={colors.primary} style={styles.text}>
        {initials || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
