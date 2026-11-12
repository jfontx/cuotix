import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Provider } from 'react-redux';

import NotFoundScreen from '@/app/+not-found';
import ProfileScreen from '@/app/(app)/(tabs)/profile';
import { AppButton, AppSwitch } from '@/components/ui';
import { haptics, setHapticsEnabled } from '@/lib/haptics';
import { secureStorage } from '@/lib/secure-storage';
import { api } from '@/store/api';
import { logout } from '@/store/auth-actions';
import authReducer, { setCredentials, type AuthUser } from '@/store/authSlice';
import { loadSettings, startSettingsPersistence } from '@/store/settings-actions';
import settingsReducer, { hydrateSettings } from '@/store/settingsSlice';
import { ThemeProvider, useAppTheme, lightColors, highContrastLight } from '@/theme';
import { Text } from 'react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(async () => null),
    setRefreshToken: jest.fn(async () => undefined),
    clearRefreshToken: jest.fn(async () => undefined),
    getSettings: jest.fn(async () => null),
    setSettings: jest.fn(async () => undefined),
  },
}));
jest.mock('@/store/auth-actions', () => ({ ...jest.requireActual('@/store/auth-actions'), logout: jest.fn(() => ({ type: 'test/logout' })) }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const user: AuthUser = { id: 'u1', email: 'ana@b.co', name: 'Ana Pérez', phone: null, role: 'USER', createdAt: '2026-11-03T12:00:00.000Z' };

function makeStore() {
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer, auth: authReducer, settings: settingsReducer },
    middleware: (gd) => gd().concat(api.middleware),
  });
  store.dispatch(setCredentials({ user, accessToken: 'a', refreshToken: 'r' }));
  return store;
}

function mockApi(routes: Record<string, () => Response>) {
  const calls: { key: string; body?: string }[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    const key = `${req.method} ${new URL(req.url).pathname}`;
    calls.push({ key, body: req.method === 'GET' ? undefined : await req.clone().text() });
    const handler = routes[key];
    return handler ? handler() : json({}, 404);
  }) as typeof fetch;
  return calls;
}

const ratings = { user: { id: 'u1', name: 'Ana' }, average: 4.8, count: 12, data: [], page: 1, limit: 50 };

beforeEach(() => {
  jest.clearAllMocks();
  setHapticsEnabled(true);
});

describe('ProfileScreen', () => {
  const renderScreen = async (store = makeStore()) =>
    render(
      <Provider store={store}>
        <ThemeProvider>
          <ProfileScreen />
        </ThemeProvider>
      </Provider>,
    );

  it('muestra datos del usuario, promedio y antigüedad', async () => {
    mockApi({ 'GET /users/u1/ratings': () => json(ratings) });
    await renderScreen();
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('ana@b.co')).toBeTruthy();
    expect(await screen.findByText('★ 4.8 · 12 calificaciones')).toBeTruthy();
    expect(screen.getByText('Desde nov 2026')).toBeTruthy();
  });

  it('indica cuando aún no hay calificaciones', async () => {
    mockApi({ 'GET /users/u1/ratings': () => json({ ...ratings, average: null, count: 0 }) });
    await renderScreen();
    expect(await screen.findByText('Sin calificaciones aún')).toBeTruthy();
  });

  it('cambia tema, alto contraste y vibración en el store', async () => {
    mockApi({ 'GET /users/u1/ratings': () => json(ratings) });
    const store = makeStore();
    await renderScreen(store);

    await fireEvent.press(screen.getByRole('button', { name: 'Oscuro' }));
    expect(store.getState().settings.theme).toBe('dark');

    const contrast = screen.getByRole('switch', { name: 'Alto contraste' });
    expect(contrast.props.accessibilityState.checked).toBe(false);
    await fireEvent(contrast, 'valueChange', true);
    expect(store.getState().settings.highContrast).toBe(true);

    await fireEvent(screen.getByRole('switch', { name: 'Vibración' }), 'valueChange', false);
    expect(store.getState().settings.haptics).toBe(false);
  });

  it('cerrar sesión despacha logout', async () => {
    mockApi({ 'GET /users/u1/ratings': () => json(ratings) });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalled();
  });

  it('navega a mis calificaciones y mis cuotas', async () => {
    mockApi({ 'GET /users/u1/ratings': () => json(ratings) });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mis calificaciones' }));
    expect(mockPush).toHaveBeenCalledWith('/users/u1');
    await fireEvent.press(screen.getByRole('button', { name: 'Mis cuotas' }));
    expect(mockPush).toHaveBeenCalledWith('/payments');
  });

  it('valida el nombre antes de guardar', async () => {
    const calls = mockApi({ 'GET /users/u1/ratings': () => json(ratings) });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'A');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/Ingresa tu nombre/)).toBeTruthy();
    expect(calls.some((c) => c.key === 'PATCH /me')).toBe(false);
  });

  it('guarda el perfil y actualiza el usuario en el store', async () => {
    const calls = mockApi({
      'GET /users/u1/ratings': () => json(ratings),
      'PATCH /me': () => json({ user: { ...user, name: 'Ana María', phone: '3001234567' } }),
    });
    const store = makeStore();
    await renderScreen(store);
    await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana María');
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '3001234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(store.getState().auth.user?.name).toBe('Ana María'));
    expect(JSON.parse(calls.find((c) => c.key === 'PATCH /me')!.body!)).toEqual({ name: 'Ana María', phone: '3001234567' });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('muestra el error del servidor al guardar', async () => {
    mockApi({
      'GET /users/u1/ratings': () => json(ratings),
      'PATCH /me': () => json({ error: { code: 'validation/error', message: 'Datos inválidos' } }, 400),
    });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Datos inválidos')).toBeTruthy();
  });
});

describe('alto contraste', () => {
  function Probe() {
    const { colors } = useAppTheme();
    return <Text testID="probe">{colors.text}</Text>;
  }

  it('cambia la paleta del tema al activarlo', async () => {
    const store = makeStore();
    await render(
      <Provider store={store}>
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByTestId('probe').props.children).toBe(lightColors.text);
    await act(async () => {
      store.dispatch(hydrateSettings({ highContrast: true, theme: 'light' }));
    });
    expect(screen.getByTestId('probe').props.children).toBe(highContrastLight.text);
  });
});

describe('persistencia de ajustes', () => {
  const settingsStore = () => configureStore({ reducer: { settings: settingsReducer } });

  it('carga las preferencias guardadas', async () => {
    (secureStorage.getSettings as jest.Mock).mockResolvedValueOnce(JSON.stringify({ theme: 'dark', highContrast: true, haptics: false }));
    const store = settingsStore();
    await loadSettings()(store.dispatch as never);
    expect(store.getState().settings).toEqual({ theme: 'dark', highContrast: true, haptics: false });
  });

  it('ignora valores inválidos y JSON dañado', async () => {
    const store = settingsStore();
    (secureStorage.getSettings as jest.Mock).mockResolvedValueOnce(JSON.stringify({ theme: 'neon', highContrast: 'sí' }));
    await loadSettings()(store.dispatch as never);
    expect(store.getState().settings).toEqual({ theme: 'system', highContrast: false, haptics: true });
    (secureStorage.getSettings as jest.Mock).mockResolvedValueOnce('{no es json');
    await expect(loadSettings()(store.dispatch as never)).resolves.toBeUndefined();
  });

  it('guarda cuando cambian y deja de guardar al cancelar', async () => {
    const store = settingsStore();
    const stop = startSettingsPersistence(store as never);
    store.dispatch(hydrateSettings({ theme: 'dark' }));
    expect(secureStorage.setSettings).toHaveBeenCalledWith(JSON.stringify({ theme: 'dark', highContrast: false, haptics: true }));
    stop();
    store.dispatch(hydrateSettings({ theme: 'light' }));
    expect(secureStorage.setSettings).toHaveBeenCalledTimes(1);
  });
});

describe('háptica', () => {
  it('respeta la preferencia', () => {
    haptics.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    setHapticsEnabled(false);
    haptics.success();
    haptics.tap();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('AppButton vibra al presionar, salvo el variante ghost', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <AppButton title="Principal" onPress={onPress} />
        <AppButton title="Discreto" variant="ghost" onPress={onPress} />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Principal' }));
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Discreto' }));
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('un fallo del motor háptico no rompe la acción', () => {
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('sin motor'));
    expect(() => haptics.tap()).not.toThrow();
  });
});

describe('AppSwitch', () => {
  it('expone rol switch y estado', async () => {
    const onValueChange = jest.fn();
    await render(<AppSwitch label="Vibración" description="Respuesta háptica" value onValueChange={onValueChange} />);
    const sw = screen.getByRole('switch', { name: 'Vibración' });
    expect(sw.props.accessibilityState.checked).toBe(true);
    await fireEvent(sw, 'valueChange', false);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });
});

describe('enlaces profundos', () => {
  it('una ruta desconocida ofrece volver al inicio', async () => {
    await render(
      <Provider store={makeStore()}>
        <NotFoundScreen />
      </Provider>,
    );
    expect(screen.getByText('Esta pantalla no existe')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
