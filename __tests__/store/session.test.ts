import { configureStore } from '@reduxjs/toolkit';

import { api } from '@/store/api';
import { authApi } from '@/store/authApi';
import { logout, restoreSession, startSession } from '@/store/auth-actions';
import authReducer, { setCredentials } from '@/store/authSlice';

const mockStorage: { token: string | null } = { token: null };
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(async () => mockStorage.token),
    setRefreshToken: jest.fn(async (t: string) => {
      mockStorage.token = t;
    }),
    clearRefreshToken: jest.fn(async () => {
      mockStorage.token = null;
    }),
  },
}));

const user = { id: 'u1', email: 'a@b.co', name: 'Ana', phone: null, role: 'USER', createdAt: '2026-11-12' };

function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer, auth: authReducer },
    middleware: (gd) => gd().concat(api.middleware),
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Responde según método + ruta; registra las peticiones. */
function mockFetch(routes: Record<string, (req: Request) => Response>) {
  const calls: { key: string; auth: string | null }[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    const key = `${req.method} ${new URL(req.url).pathname}`;
    calls.push({ key, auth: req.headers.get('authorization') });
    const handler = routes[key];
    if (!handler) throw new Error(`ruta no mockeada: ${key}`);
    return handler(req);
  }) as typeof fetch;
  return calls;
}

beforeEach(() => {
  mockStorage.token = null;
});


describe('sesión', () => {
  it('startSession guarda el refresh token en secure-store y el estado', async () => {
    const store = makeStore();
    await store.dispatch(startSession({ user: user as never, accessToken: 'a', refreshToken: 'r' }));
    expect(mockStorage.token).toBe('r');
    expect(store.getState().auth.status).toBe('authenticated');
  });

  it('restoreSession sin token guardado deja la sesión cerrada', async () => {
    const store = makeStore();
    await store.dispatch(restoreSession());
    expect(store.getState().auth.status).toBe('unauthenticated');
  });

  it('restoreSession renueva tokens y carga el perfil', async () => {
    mockStorage.token = 'old';
    mockFetch({
      'POST /auth/refresh': () => json({ accessToken: 'a2', refreshToken: 'r2' }),
      'GET /me': () => json({ user }),
    });
    const store = makeStore();
    await store.dispatch(restoreSession());
    expect(store.getState().auth).toMatchObject({ status: 'authenticated', accessToken: 'a2', user: { name: 'Ana' } });
    expect(mockStorage.token).toBe('r2');
  });

  it('restoreSession con refresh token rechazado limpia la sesión y el almacenamiento', async () => {
    mockStorage.token = 'old';
    mockFetch({ 'POST /auth/refresh': () => json({ error: { code: 'auth/token-revoked' } }, 401) });
    const store = makeStore();
    await store.dispatch(restoreSession());
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(mockStorage.token).toBeNull();
  });

  it('restoreSession sin red cierra la sesión en memoria pero conserva el token guardado', async () => {
    mockStorage.token = 'old';
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    const store = makeStore();
    await store.dispatch(restoreSession());
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(mockStorage.token).toBe('old');
  });
});

describe('interceptor de refresh automático', () => {
  it('ante un 401 renueva el token y reintenta la petición', async () => {
    const store = makeStore();
    mockStorage.token = 'r1';
    store.dispatch(setCredentials({ user: user as never, accessToken: 'expired', refreshToken: 'r1' }));
    let meCalls = 0;
    const calls = mockFetch({
      'GET /me': () => (++meCalls === 1 ? json({}, 401) : json({ user })),
      'POST /auth/refresh': () => json({ accessToken: 'fresh', refreshToken: 'r2' }),
    });
    const res = await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(res.data?.user.name).toBe('Ana');
    expect(calls.map((c) => c.key)).toEqual(['GET /me', 'POST /auth/refresh', 'GET /me']);
    expect(calls[2].auth).toBe('Bearer fresh');
    expect(mockStorage.token).toBe('r2');
  });

  it('peticiones 401 simultáneas comparten una sola renovación', async () => {
    const store = makeStore();
    store.dispatch(setCredentials({ user: user as never, accessToken: 'expired', refreshToken: 'r1' }));
    const calls = mockFetch({
      'GET /me': (req) => (req.headers.get('authorization') === 'Bearer fresh' ? json({ user }) : json({}, 401)),
      'PATCH /me': (req) => (req.headers.get('authorization') === 'Bearer fresh' ? json({ user }) : json({}, 401)),
      'POST /auth/refresh': () => json({ accessToken: 'fresh', refreshToken: 'r2' }),
    });
    await Promise.all([
      store.dispatch(authApi.endpoints.getMe.initiate()),
      store.dispatch(authApi.endpoints.updateMe.initiate({ name: 'Nuevo' })),
    ]);
    expect(calls.filter((c) => c.key === 'POST /auth/refresh')).toHaveLength(1);
  });

  it('si la renovación falla cierra la sesión', async () => {
    const store = makeStore();
    mockStorage.token = 'r1';
    store.dispatch(setCredentials({ user: user as never, accessToken: 'expired', refreshToken: 'r1' }));
    mockFetch({
      'GET /me': () => json({}, 401),
      'POST /auth/refresh': () => json({}, 401),
    });
    await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(mockStorage.token).toBeNull();
  });

  it('un 401 de /auth/login no dispara renovación', async () => {
    const store = makeStore();
    const calls = mockFetch({ 'POST /auth/login': () => json({ error: { code: 'auth/invalid-credentials' } }, 401) });
    const res = await store.dispatch(authApi.endpoints.login.initiate({ email: 'a@b.co', password: 'x' }));
    expect(res.error).toBeDefined();
    expect(calls).toHaveLength(1);
  });
});

describe('logout', () => {
  it('invalida el token en el servidor, limpia secure-store y el estado', async () => {
    const store = makeStore();
    mockStorage.token = 'r1';
    store.dispatch(setCredentials({ user: user as never, accessToken: 'a', refreshToken: 'r1' }));
    const calls = mockFetch({ 'POST /auth/logout': () => new Response(null, { status: 204 }) });
    await store.dispatch(logout());
    expect(calls.map((c) => c.key)).toEqual(['POST /auth/logout']);
    expect(store.getState().auth).toMatchObject({ status: 'unauthenticated', accessToken: null, user: null });
    expect(mockStorage.token).toBeNull();
  });

  it('cierra la sesión local aunque falle la red', async () => {
    const store = makeStore();
    mockStorage.token = 'r1';
    store.dispatch(setCredentials({ user: user as never, accessToken: 'a', refreshToken: 'r1' }));
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    await store.dispatch(logout());
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(mockStorage.token).toBeNull();
  });
});
