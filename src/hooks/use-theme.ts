import { useAppTheme } from '@/theme';

/** Adaptador para los componentes de plantilla (`ThemedText`, `ThemedView`) sobre el tema de la app. */
export function useTheme() {
  const { colors } = useAppTheme();

  return {
    text: colors.text,
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: colors.border,
    textSecondary: colors.textSecondary,
  };
}
