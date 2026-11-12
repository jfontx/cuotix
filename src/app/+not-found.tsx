import { Redirect, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import { AppButton, AppEmptyState, AppScreen } from '@/components/ui';
import { selectIsAuthenticated } from '@/store/authSlice';

/** Enlaces profundos o rutas desconocidas: se ofrece volver al inicio. */
export default function NotFoundScreen() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Sin sesión, `/` pertenece a una ruta protegida y no se resuelve: se envía al login
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <AppScreen centered>
      <AppEmptyState title="Esta pantalla no existe" message="El enlace que abriste no es válido o ya no está disponible." icon="error" />
      <AppButton title="Ir al inicio" onPress={() => router.replace('/')} />
    </AppScreen>
  );
}
