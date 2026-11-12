import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

/** Separador puramente visual: se oculta a los lectores de pantalla. */
export function AppDivider() {
  const { colors } = useAppTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.line, { backgroundColor: colors.border }]}
    />
  );
}

const styles = StyleSheet.create({ line: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' } });
