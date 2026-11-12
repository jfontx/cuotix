import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import CreateGroupScreen from '@/app/(app)/groups/create';
import GroupDetailScreen from '@/app/(app)/groups/[id]';
import ExploreScreen from '@/app/(app)/(tabs)/explore';
import HomeScreen from '@/app/(app)/(tabs)/index';
import { createGroupSchema, fieldErrors } from '@/lib/validation';
import { store } from '@/store';
import { api } from '@/store/api';
import type { GroupDetail } from '@/store/groupsApi';

import { makeGroup } from './components/group-card.test';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ id: 'g1' }),
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

const service = makeGroup().service;
const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

/** Responde según la ruta; devuelve las URLs pedidas para poder inspeccionarlas. */
function mockApi(routes: Record<string, () => Response>) {
  const calls: { url: string; method: string; body?: string }[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    // fetchBaseQuery llama a fetch con un Request
    const req = input instanceof Request ? input : undefined;
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = raw.replace(/^https?:\/\/[^/]+/, '');
    const method = req?.method ?? init?.method ?? 'GET';
    calls.push({ url, method, body: req && method !== 'GET' ? await req.clone().text() : undefined });
    // Se elige la ruta más específica (la más larga)
    const key = Object.keys(routes)
      .filter((k) => url.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return key ? routes[key]() : json({ error: { message: 'No encontrado' } }, 404);
  }) as typeof fetch;
  return calls;
}

const renderScreen = async (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(api.util.resetApiState());
});

describe('createGroupSchema', () => {
  const valid = {
    serviceId: 's1',
    title: 'Spotify',
    description: '',
    pricePerMember: '8000',
    paymentDay: '15',
    slots: '4',
    payoutMethod: 'Nequi',
    payoutDetail: '3001234567',
  };

  it('convierte los números y acepta datos válidos', () => {
    const r = createGroupSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ pricePerMember: 8000, paymentDay: 15, slots: 4 });
  });

  it('reporta cada campo inválido', () => {
    const r = createGroupSchema.safeParse({ ...valid, serviceId: '', title: 'a', paymentDay: '31', slots: 'x', pricePerMember: '0' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(['paymentDay', 'pricePerMember', 'serviceId', 'slots', 'title']);
    }
  });
});

describe('HomeScreen', () => {
  it('lista mis grupos', async () => {
    const calls = mockApi({ '/groups': () => json({ data: [makeGroup()], pagination }) });
    await renderScreen(<HomeScreen />);
    expect(await screen.findByText('Spotify del barrio')).toBeTruthy();
    expect(calls[0].url).toContain('mine=true');
    await fireEvent.press(screen.getByRole('button', { name: /Spotify Premium Familiar/ }));
    expect(mockPush).toHaveBeenCalledWith('/groups/g1');
  });

  it('muestra estado vacío y permite crear un grupo', async () => {
    mockApi({ '/groups': () => json({ data: [], pagination: { ...pagination, total: 0, totalPages: 0 } }) });
    await renderScreen(<HomeScreen />);
    expect(await screen.findByText('Aún no estás en ningún grupo')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear grupo' }));
    expect(mockPush).toHaveBeenCalledWith('/groups/create');
  });

  it('muestra el error del servidor', async () => {
    mockApi({ '/groups': () => json({ error: { code: 'general/internal-error', message: 'Error interno, intenta más tarde' } }, 500) });
    await renderScreen(<HomeScreen />);
    expect(await screen.findByText('Error interno, intenta más tarde')).toBeTruthy();
  });
});

describe('ExploreScreen', () => {
  it('excluye mis grupos y filtra por servicio', async () => {
    const calls = mockApi({
      '/services': () => json({ data: [service] }),
      '/groups': () => json({ data: [makeGroup()], pagination }),
    });
    await renderScreen(<ExploreScreen />);
    expect(await screen.findByText('Spotify del barrio')).toBeTruthy();
    expect(calls.some((c) => c.url.startsWith('/groups') && c.url.includes('excludeMine=true'))).toBe(true);

    await fireEvent.press(await screen.findByRole('button', { name: 'Spotify Premium Familiar', selected: false }));
    await waitFor(() => expect(calls.some((c) => c.url.includes('serviceId=s1'))).toBe(true));
  });

  it('muestra estado vacío sin resultados', async () => {
    mockApi({
      '/services': () => json({ data: [service] }),
      '/groups': () => json({ data: [], pagination: { ...pagination, total: 0, totalPages: 0 } }),
    });
    await renderScreen(<ExploreScreen />);
    expect(await screen.findByText('No encontramos grupos')).toBeTruthy();
  });
});

describe('GroupDetailScreen', () => {
  const detail = (over: Partial<GroupDetail> = {}): GroupDetail => ({
    ...makeGroup({ description: 'Cupos para vecinos' }),
    isOwner: false,
    myMembership: null,
    ...over,
  });

  it('oculta los datos de pago a quien no es miembro', async () => {
    mockApi({ '/groups/g1': () => json({ group: detail() }) });
    await renderScreen(<GroupDetailScreen />);
    expect(await screen.findByText('Spotify del barrio')).toBeTruthy();
    expect(screen.getByText(/Los datos de pago se muestran cuando/)).toBeTruthy();
    expect(screen.queryByText('3001234567')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cerrar grupo' })).toBeNull();
  });

  it('muestra los datos de pago a un miembro activo', async () => {
    mockApi({
      '/groups/g1': () => json({ group: detail({ myMembership: { id: 'm1', status: 'ACTIVE' }, payoutDetail: '3001234567' }) }),
    });
    await renderScreen(<GroupDetailScreen />);
    expect(await screen.findByText('3001234567')).toBeTruthy();
    expect(screen.getByText('Eres miembro activo')).toBeTruthy();
  });

  it('el administrador puede cerrar el grupo tras confirmar', async () => {
    const calls = mockApi({
      '/groups/g1/close': () => json({ group: detail({ isOwner: true, status: 'CLOSED' }) }),
      '/groups/g1': () => json({ group: detail({ isOwner: true, payoutDetail: '3001234567' }) }),
    });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar grupo' }));
    expect(screen.getByText('¿Cerrar el grupo?')).toBeTruthy();
    expect(calls.some((c) => c.url.endsWith('/close'))).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, cerrar grupo' }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith('/close') && c.method === 'POST')).toBe(true));
  });

  it('muestra el error cuando cerrar falla', async () => {
    mockApi({
      '/groups/g1/close': () =>
        json({ error: { code: 'group/has-pending-payments', message: 'Hay pagos pendientes de confirmar' } }, 409),
      '/groups/g1': () => json({ group: detail({ isOwner: true }) }),
    });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar grupo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, cerrar grupo' }));
    expect(await screen.findByText('Hay pagos pendientes de confirmar')).toBeTruthy();
  });
});

describe('CreateGroupScreen', () => {
  it('valida antes de enviar', async () => {
    const calls = mockApi({ '/services': () => json({ data: [service] }) });
    await renderScreen(<CreateGroupScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Crear grupo' }));
    expect(await screen.findByText('Elige un servicio')).toBeTruthy();
    expect(screen.getByText('El título debe tener al menos 3 caracteres')).toBeTruthy();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('valida los cupos contra el máximo del servicio', async () => {
    mockApi({ '/services': () => json({ data: [service] }) });
    await renderScreen(<CreateGroupScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Spotify Premium Familiar' }));
    await fillForm({ slots: '6' });
    await fireEvent.press(screen.getByRole('button', { name: 'Crear grupo' }));
    expect(await screen.findByText('Máximo 5 cupos para este servicio')).toBeTruthy();
  });

  it('crea el grupo y navega al detalle', async () => {
    const calls = mockApi({
      '/services': () => json({ data: [service] }),
      '/groups': () => json({ group: { ...makeGroup({ id: 'nuevo' }), isOwner: true, myMembership: null } }, 201),
    });
    await renderScreen(<CreateGroupScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Spotify Premium Familiar' }));
    await fillForm({});
    await fireEvent.press(screen.getByRole('button', { name: 'Crear grupo' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/groups/nuevo'));
    const post = calls.find((c) => c.method === 'POST')!;
    expect(JSON.parse(post.body!)).toEqual({
      serviceId: 's1',
      title: 'Spotify del barrio',
      pricePerMember: 8000,
      paymentDay: 15,
      slots: 4,
      payoutMethod: 'Nequi',
      payoutDetail: '3001234567',
    });
  });
});

async function fillForm(over: Partial<Record<'slots', string>>) {
  const values: Record<string, string> = {
    Título: 'Spotify del barrio',
    'Precio por miembro (COP al mes)': '8000',
    'Día de pago del mes': '15',
    'Cupos que ofreces': over.slots ?? '4',
    'Medio de pago': 'Nequi',
    'Número o cuenta para recibir pagos': '3001234567',
  };
  for (const [label, value] of Object.entries(values)) {
    await fireEvent.changeText(screen.getByLabelText(`${label}, requerido`), value);
  }
}
