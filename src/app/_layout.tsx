import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { store, type AppDispatch } from '@/store';
import { restoreSession } from '@/store/auth-actions';
import { selectAuthStatus, selectIsAuthenticated } from '@/store/authSlice';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </ThemeProvider>
    </Provider>
  );
}
