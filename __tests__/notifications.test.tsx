import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Provider } from 'react-redux';

import NotificationsScreen from '@/app/(app)/(tabs)/notifications';
import { clearCurrentPushToken, getCurrentPushToken, getPushToken, routeForNotification, tagsForNotification } from '@/lib/push';
import { api } from '@/store/api';
import { logout, startSession } from '@/store/auth-actions';
import authReducer, { setCredentials } from '@/store/authSlice';
import type { AppNotification } from '@/store/notificationsApi';
import settingsReducer from '@/store/settingsSlice';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(async () => null),
    setRefreshToken: jest.fn(async () => undefined),
    clearRefreshToken: jest.fn(async () => undefined),
  },
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer, auth: authReducer, settings: settingsReducer },
    middleware: (gd) => gd().concat(api.middleware),
  });
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

const note = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: 'n1',
  type: 'PAYMENT_REMINDER',
  title: 'Recordatorio de pago',
  body: 'Tu cuota vence hoy',
  paymentId: 'p1',
  data: { groupId: 'g1', paymentId: 'p1' },
  read: false,
  sentAt: '2026-11-13T14:00:00.000Z',
  ...over,
});
const page = (data: AppNotification[]) => ({ data, page: 1, limit: 50, total: data.length, unread: data.filter((n) => !n.read).length });

const setDevice = (isDevice: boolean) => Object.defineProperty(Device, 'isDevice', { value: isDevice, configurable: true });

beforeEach(() => {
  jest.clearAllMocks();
  clearCurrentPushToken();
  setDevice(false);
});

describe('pantalla de notificaciones', () => {
  const renderScreen = async (store = makeStore()) => render(<Provider store={store}><NotificationsScreen /></Provider>);

  it('lista las notificaciones y marca como leída al abrir', async () => {
    const calls = mockApi({
      'GET /me/notifications': () => json(page([note()])),
      'PATCH /notifications/n1/read': () => json({ notification: note({ read: true }) }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/No leída\. Recordatorio de pago/));
    expect(mockPush).toHaveBeenCalledWith('/payments/p1');
    await waitFor(() => expect(calls.some((c) => c.key === 'PATCH /notifications/n1/read')).toBe(true));
  });

  it('no vuelve a marcar una notificación ya leída', async () => {
    const calls = mockApi({ 'GET /me/notifications': () => json(page([note({ read: true })])) });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/Recordatorio de pago/));
    expect(calls.some((c) => c.key.startsWith('PATCH'))).toBe(false);
  });

  it('marca todas como leídas', async () => {
    const calls = mockApi({
      'GET /me/notifications': () => json(page([note(), note({ id: 'n2' })])),
      'POST /me/notifications/read-all': () => json({ updated: 2 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByText('Marcar todas como leídas (2)'));
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /me/notifications/read-all')).toBe(true));
  });

  it('muestra el estado vacío', async () => {
    mockApi({ 'GET /me/notifications': () => json(page([])) });
    await renderScreen();
    expect(await screen.findByText('No tienes notificaciones')).toBeTruthy();
  });
});

describe('push', () => {
  it('no pide token en simulador', async () => {
    expect(await getPushToken()).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('devuelve null si se deniega el permiso', async () => {
    setDevice(true);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    expect(await getPushToken()).toBeNull();
  });

  it('devuelve null si falla la obtención del token', async () => {
    setDevice(true);
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(new Error('sin red'));
    expect(await getPushToken()).toBeNull();
  });

  it('registra el token al iniciar sesión y lo elimina al cerrar sesión', async () => {
    setDevice(true);
    const calls = mockApi({
      'POST /me/push-token': () => new Response(null, { status: 204 }),
      'POST /auth/logout': () => new Response(null, { status: 204 }),
    });
    const store = makeStore();
    await store.dispatch(startSession({ accessToken: 'a', refreshToken: 'r' }));
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /me/push-token')).toBe(true));
    expect(JSON.parse(calls.find((c) => c.key === 'POST /me/push-token')!.body!)).toMatchObject({ token: 'ExponentPushToken[test]' });
    expect(getCurrentPushToken()).toBe('ExponentPushToken[test]');

    await store.dispatch(logout());
    expect(JSON.parse(calls.find((c) => c.key === 'POST /auth/logout')!.body!)).toEqual({
      refreshToken: 'r',
      pushToken: 'ExponentPushToken[test]',
    });
    expect(getCurrentPushToken()).toBeNull();
  });

  it('un fallo al registrar el token no rompe el inicio de sesión', async () => {
    setDevice(true);
    mockApi({ 'POST /me/push-token': () => json({ error: {} }, 500) });
    const store = makeStore();
    await store.dispatch(startSession({ accessToken: 'a', refreshToken: 'r' }));
    await waitFor(() => expect(getCurrentPushToken()).not.toBeNull());
    expect(store.getState().auth.status).toBe('authenticated');
  });
});

describe('invalidación de caché por push', () => {
  it('pagos invalidan la cuota y la lista', () => {
    expect(tagsForNotification('PAYMENT_CONFIRMED', { paymentId: 'p1' })).toEqual([
      { type: 'Notification', id: 'LIST' },
      { type: 'Payment', id: 'p1' },
      { type: 'Payment', id: 'LIST' },
    ]);
  });

  it('membresías invalidan grupos y membresías', () => {
    expect(tagsForNotification('MEMBERSHIP_APPROVED')).toEqual(
      expect.arrayContaining([{ type: 'Group', id: 'LIST' }, { type: 'Membership', id: 'LIST' }]),
    );
  });

  it('invalidar la etiqueta recarga la lista de notificaciones', async () => {
    let hits = 0;
    mockApi({ 'GET /me/notifications': () => (hits++, json(page([])) ) });
    const store = makeStore();
    store.dispatch(setCredentials({ accessToken: 'a', refreshToken: 'r' }));
    await render(<Provider store={store}><NotificationsScreen /></Provider>);
    await screen.findByText('No tienes notificaciones');
    store.dispatch(api.util.invalidateTags(tagsForNotification('PAYMENT_REMINDER', { paymentId: 'p1' })));
    await waitFor(() => expect(hits).toBe(2));
  });

  it('rutas: cuota > grupo > ninguna', () => {
    expect(routeForNotification({ paymentId: 'p1' })).toBe('/payments/p1');
    expect(routeForNotification({ data: { groupId: 'g1' } })).toBe('/groups/g1');
    expect(routeForNotification({ data: null })).toBeNull();
  });
});
