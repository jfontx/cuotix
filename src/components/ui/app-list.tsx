import { FlatList, StyleSheet, type FlatListProps } from 'react-native';

import { spacing } from '@/theme/spacing';

import { AppEmptyState, type AppEmptyStateProps } from './app-empty-state';

export interface AppListProps<T> extends Omit<FlatListProps<T>, 'ListEmptyComponent'> {
  /** Se muestra cuando no hay elementos */
  empty?: AppEmptyStateProps;
}

/** FlatList con separación uniforme, estado vacío y lector de pantalla listo para listas. */
export function AppList<T>({ empty, contentContainerStyle, ...rest }: AppListProps<T>) {
  return (
    <FlatList
      accessibilityRole="list"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, contentContainerStyle]}
      ListEmptyComponent={empty ? <AppEmptyState {...empty} /> : undefined}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.md, paddingBottom: spacing.lg } });
