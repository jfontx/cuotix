import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import GroupDetailScreen from '@/app/(app)/groups/[id]';
import JoinGroupScreen from '@/app/(app)/groups/[id]/join';
import MembersScreen from '@/app/(app)/groups/[id]/members';
import { MemberCard } from '@/components/member-card';
import { AppAvatar, AppButton } from '@/components/ui';
import { store } from '@/store';
import { api } from '@/store/api';
import type { GroupDetail } from '@/store/groupsApi';
import type { Member } from '@/store/membershipsApi';

import { makeGroup } from './components/group-card.test';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
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

function mockApi(routes: Record<string, () => Response>) {
  const calls: { url: string; method: string; body?: string }[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : undefined;
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = raw.replace(/^https?:\/\/[^/]+/, '');
    const method = req?.method ?? init?.method ?? 'GET';
    calls.push({ url, method, body: req && method !== 'GET' ? await req.clone().text() : undefined });
    const key = Object.keys(routes)
      .filter((k) => url.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return key ? routes[key]() : json({ error: { message: 'No encontrado' } }, 404);
  }) as typeof fetch;
  return calls;
}

const renderScreen = async (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

const member = (over: Partial<Member> = {}): Member => ({
  id: 'm1',
  status: 'ACTIVE',
  joinedAt: null,
  user: { id: 'u1', name: 'Ana Pérez' },
  ...over,
});

const detail = (over: Partial<GroupDetail> = {}): GroupDetail => ({
  ...makeGroup(),
  isOwner: false,
  myMembership: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(api.util.resetApiState());
});

describe('AppAvatar y MemberCard', () => {
  it('muestra iniciales y las oculta a los lectores de pantalla', async () => {
    await render(<AppAvatar name="ana pérez" />);
    expect(screen.getByText('AP', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('AP')).toBeNull();
  });

  it('describe al miembro en su etiqueta de accesibilidad', async () => {
    await renderScreen(<MemberCard member={member({ status: 'PENDING', firstAmount: 5000 })} />);
    expect(screen.getByLabelText('Ana Pérez. Solicitud pendiente. Primera cuota de $5.000')).toBeTruthy();
  });

  it('deja las acciones fuera de la tarjeta para que sean accesibles', async () => {
    const onPress = jest.fn();
    await renderScreen(
      <MemberCard member={member()} actions={<AppButton title="Acción" onPress={onPress} />} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Acción' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('JoinGroupScreen', () => {
  it('envía la solicitud y vuelve al detalle', async () => {
    const calls = mockApi({
      '/groups/g1/join': () =>
        json({ membership: { id: 'm1', groupId: 'g1', userId: 'u1', status: 'PENDING', joinedAt: null, leavesAt: null, firstAmount: null } }, 201),
      '/groups/g1': () => json({ group: detail() }),
    });
    await renderScreen(<JoinGroupScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Enviar solicitud' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/groups/g1'));
    expect(calls.some((c) => c.url === '/groups/g1/join' && c.method === 'POST')).toBe(true);
  });

  it('muestra el error del servidor si el grupo se llenó', async () => {
    mockApi({
      '/groups/g1/join': () => json({ error: { code: 'group/full', message: 'Este grupo no tiene cupos disponibles' } }, 409),
      '/groups/g1': () => json({ group: detail() }),
    });
    await renderScreen(<JoinGroupScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Enviar solicitud' }));
    expect(await screen.findByText('Este grupo no tiene cupos disponibles')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('MembersScreen', () => {
  const pending = member({ id: 'm2', status: 'PENDING', user: { id: 'u2', name: 'Luis Gómez' } });
  const routes = (isOwner: boolean, members: Member[]) => ({
    '/groups/g1/members': () => json({ data: members }),
    '/groups/g1': () => json({ group: detail({ isOwner }) }),
  });

  it('el administrador aprueba con un monto distinto para la primera cuota', async () => {
    const calls = mockApi({
      '/memberships/m2/approve': () => json({ membership: {} }),
      ...routes(true, [member(), pending]),
    });
    await renderScreen(<MembersScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Aprobar' }));
    await fireEvent.changeText(screen.getByLabelText('Monto de la primera cuota (opcional)'), '5000');
    await fireEvent.press(screen.getByRole('button', { name: 'Aprobar solicitud' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/memberships/m2/approve')).toBe(true));
    const call = calls.find((c) => c.url === '/memberships/m2/approve')!;
    expect(call.method).toBe('PATCH');
    expect(JSON.parse(call.body!)).toEqual({ firstAmount: 5000 });
  });

  it('valida el monto antes de aprobar', async () => {
    const calls = mockApi(routes(true, [pending]));
    await renderScreen(<MembersScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Aprobar' }));
    await fireEvent.changeText(screen.getByLabelText('Monto de la primera cuota (opcional)'), '12ab');
    await fireEvent.press(screen.getByRole('button', { name: 'Aprobar solicitud' }));
    expect(await screen.findByText('Ingresa solo números')).toBeTruthy();
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('el administrador rechaza una solicitud', async () => {
    const calls = mockApi({ '/memberships/m2/reject': () => json({ membership: {} }), ...routes(true, [pending]) });
    await renderScreen(<MembersScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Rechazar' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/memberships/m2/reject' && c.method === 'PATCH')).toBe(true));
  });

  it('muestra el error cuando la expulsión no es elegible', async () => {
    mockApi({
      '/memberships/m1/remove': () =>
        json({ error: { code: 'membership/not-eligible-removal', message: 'Este miembro no puede ser expulsado aún' } }, 409),
      ...routes(true, [member()]),
    });
    await renderScreen(<MembersScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Expulsar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, expulsar' }));
    expect(await screen.findByText('Este miembro no puede ser expulsado aún')).toBeTruthy();
  });

  it('un miembro no ve acciones de administración', async () => {
    mockApi(routes(false, [member()]));
    await renderScreen(<MembersScreen />);
    expect(await screen.findByText('Ana Pérez', { exact: false })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Expulsar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Aprobar' })).toBeNull();
  });

  it('muestra el estado vacío', async () => {
    mockApi(routes(true, []));
    await renderScreen(<MembersScreen />);
    expect(await screen.findByText('Aún no hay miembros')).toBeTruthy();
  });
});

describe('GroupDetailScreen: membresía', () => {
  it('ofrece solicitar unirse a quien no es miembro', async () => {
    mockApi({ '/groups/g1': () => json({ group: detail() }) });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Solicitar unirme' }));
    expect(mockPush).toHaveBeenCalledWith('/groups/g1/join');
  });

  it('no ofrece solicitar si el grupo está completo', async () => {
    mockApi({ '/groups/g1': () => json({ group: detail({ status: 'FULL' }) }) });
    await renderScreen(<GroupDetailScreen />);
    await screen.findByText('Spotify del barrio');
    expect(screen.queryByRole('button', { name: 'Solicitar unirme' })).toBeNull();
  });

  it('permite confirmar el acceso cuando fue aprobado', async () => {
    const calls = mockApi({
      '/memberships/m1/confirm-access': () => json({ membership: {} }),
      '/groups/g1': () => json({ group: detail({ myMembership: { id: 'm1', status: 'APPROVED' }, payoutDetail: '3001234567' }) }),
    });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Ya tengo acceso al servicio' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/memberships/m1/confirm-access' && c.method === 'POST')).toBe(true));
  });

  it('pide confirmación antes de salir del grupo', async () => {
    const calls = mockApi({
      '/memberships/m1/leave': () => json({ membership: {} }),
      '/groups/g1': () => json({ group: detail({ myMembership: { id: 'm1', status: 'ACTIVE' } }) }),
    });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Salir del grupo' }));
    expect(screen.getByText('¿Salir del grupo?')).toBeTruthy();
    expect(calls.some((c) => c.url.endsWith('/leave'))).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, salir del grupo' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/memberships/m1/leave' && c.method === 'POST')).toBe(true));
  });

  it('el administrador ve el acceso a miembros y solicitudes', async () => {
    mockApi({ '/groups/g1': () => json({ group: detail({ isOwner: true }) }) });
    await renderScreen(<GroupDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Miembros y solicitudes' }));
    expect(mockPush).toHaveBeenCalledWith('/groups/g1/members');
    expect(screen.queryByRole('button', { name: 'Solicitar unirme' })).toBeNull();
  });
});
