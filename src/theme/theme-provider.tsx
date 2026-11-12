import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { selectSettings } from '@/store/settingsSlice';

import { darkColors, highContrastDark, highContrastLight, lightColors, type AppColors } from './colors';

export interface AppTheme {
  colors: AppColors;
  isDark: boolean;
  highContrast: boolean;
}

const defaultTheme: AppTheme = { colors: lightColors, isDark: false, highContrast: false };

const ThemeContext = createContext<AppTheme>(defaultTheme);

/** Resuelve tema (sistema/claro/oscuro) y alto contraste a partir de `settings`. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { theme, highContrast } = useSelector(selectSettings);
  const isDark = theme === 'system' ? system === 'dark' : theme === 'dark';

  const value = useMemo<AppTheme>(() => {
    const colors = isDark ? (highContrast ? highContrastDark : darkColors) : highContrast ? highContrastLight : lightColors;
    return { colors, isDark, highContrast };
  }, [isDark, highContrast]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
