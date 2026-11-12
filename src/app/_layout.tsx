import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useNotificationListeners } from '@/hooks/use-notification-listeners';
import { store, type AppDispatch } from '@/store';
import { restoreSession } from '@/store/auth-actions';
import { loadSettings, startSettingsPersistence } from '@/store/settings-actions';
import { selectAuthStatus, selectIsAuthenticated } from '@/store/authSlice';
import { useAppTheme, ThemeProvider as AppThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // Primero se cargan las preferencias y luego se activa el guardado, para no pisarlas con los valores por defecto
    let stop: (() => void) | undefined;
    dispatch(loadSettings()).then(() => {
      stop = startSettingsPersistence(store);
    });
    dispatch(restoreSession());
    return () => stop?.();
  }, [dispatch]);

  useNotificationListeners(isAuthenticated);

  // Mientras se restaura la sesión se mantiene el splash
  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

/** Puente entre el tema de la app y el de React Navigation */
function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useAppTheme();
  return <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <NavigationThemeBridge>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </NavigationThemeBridge>
      </AppThemeProvider>
    </Provider>
  );
}
