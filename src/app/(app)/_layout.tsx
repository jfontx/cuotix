import { Stack } from 'expo-router';

import { useAppTheme } from '@/theme';

export default function AppLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="groups/create" options={{ title: 'Crear grupo' }} />
      <Stack.Screen name="groups/[id]" options={{ title: 'Grupo' }} />
    </Stack>
  );
}
