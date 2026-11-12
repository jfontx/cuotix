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
      <Stack.Screen name="groups/[id]/index" options={{ title: 'Grupo' }} />
      <Stack.Screen name="groups/[id]/join" options={{ title: 'Solicitar unirme' }} />
      <Stack.Screen name="groups/[id]/members" options={{ title: 'Miembros' }} />
      <Stack.Screen name="groups/[id]/payments" options={{ title: 'Cuotas del grupo' }} />
      <Stack.Screen name="payments/index" options={{ title: 'Mis cuotas' }} />
      <Stack.Screen name="payments/[id]" options={{ title: 'Cuota' }} />
      <Stack.Screen name="payments/mark-paid" options={{ title: 'Marcar como pagada' }} />
    </Stack>
  );
}
