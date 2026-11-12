import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

import { AppButton } from './app-button';
import { AppIcon } from './app-icon';
import { AppText } from './app-text';

export interface AppScreenProps {
  title?: string;
  children: ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  headerRight?: ReactNode;
  /** Centra verticalmente el contenido (p. ej. formularios de acceso) */
  centered?: boolean;
}

const MAX_CONTENT_WIDTH = 800;

export function AppScreen({ title, children, scrollable = false, loading, error, onRetry, headerRight, centered }: AppScreenProps) {
  const { colors } = useAppTheme();

  let body: ReactNode = children;
  if (loading) {
    body = (
      <View style={styles.center} accessible accessibilityLabel="Cargando" accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (error) {
    body = (
      <View style={styles.center} accessibilityLiveRegion="assertive" accessibilityRole="alert">
        <AppIcon name="error" size={32} color={colors.error} />
        <AppText color={colors.error} style={styles.errorText}>
          {error}
        </AppText>
        {onRetry ? <AppButton title="Reintentar" onPress={onRetry} variant="outline" fullWidth={false} /> : null}
      </View>
    );
  }

  const contentStyle = [styles.content, centered && styles.centered];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          {title || headerRight ? (
            <View style={styles.header}>
              {title ? <AppText variant="h1" style={styles.flex}>{title}</AppText> : <View style={styles.flex} />}
              {headerRight}
            </View>
          ) : null}
          {scrollable && !loading && !error ? (
            <ScrollView contentContainerStyle={[contentStyle, styles.grow]} keyboardShouldPersistTaps="handled">
              {body}
            </ScrollView>
          ) : (
            <View style={[contentStyle, styles.flex]}>{body}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  content: { padding: spacing.lg, gap: spacing.md },
  centered: { justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { textAlign: 'center' },
});
