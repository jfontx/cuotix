import { useRouter } from 'expo-router';

import { AppButton, AppEmptyState, AppScreen } from '@/components/ui';

/** Enlaces profundos o rutas desconocidas: se ofrece volver al inicio. */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppScreen centered>
      <AppEmptyState title="Esta pantalla no existe" message="El enlace que abriste no es válido o ya no está disponible." icon="error" />
      <AppButton title="Ir al inicio" onPress={() => router.replace('/')} />
    </AppScreen>
  );
}
