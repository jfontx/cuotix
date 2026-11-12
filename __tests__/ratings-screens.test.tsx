import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import RateUserScreen from '@/app/(app)/ratings/create';
import ReportUserScreen from '@/app/(app)/reports/create';
import UserProfileScreen from '@/app/(app)/users/[id]';
import { AppRating } from '@/components/ui';
import { store } from '@/store';
import { api } from '@/store/api';
import { clearCredentials } from '@/store/authSlice';
import type { UserRatings } from '@/store/ratingsApi';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
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

const ratings = (over: Partial<UserRatings> = {}): UserRatings => ({
  user: { id: 'u2', name: 'Carlos Ruiz' },
  average: 4.5,
  count: 2,
  page: 1,
  limit: 50,
  data: [
    {
      id: 'r1',
      score: 5,
      comment: 'Muy puntual',
      createdAt: '2026-11-10T00:00:00.000Z',
      group: { id: 'g1', title: 'Spotify Familiar' },
      from: { id: 'u3', name: 'Ana Pérez' },
    },
  ],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  store.dispatch(api.util.resetApiState());
  store.dispatch(clearCredentials());
});

describe('AppRating', () => {
  it('solo lectura: un único elemento con el valor en texto', async () => {
    await render(<AppRating value={4} readonly />);
    expect(screen.getByLabelText('Calificación: 4 de 5 estrellas')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('editable: cinco opciones con etiqueta, estado seleccionado y onChange', async () => {
    const onChange = jest.fn();
    await render(<AppRating value={3} onChange={onChange} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByLabelText('3 estrellas').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('1 estrella')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('5 estrellas'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('cada estrella mide al menos 48dp', async () => {
    await render(<AppRating value={0} onChange={jest.fn()} />);
    const star = screen.getByLabelText('2 estrellas');
    const style = Object.assign({}, ...[star.props.style].flat(2));
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
  });
});

describe('Perfil de usuario', () => {
  it('muestra promedio, cantidad y calificaciones', async () => {
    mockParams = { id: 'u2' };
    mockApi({ '/users/u2/ratings': () => json(ratings()) });
    await renderScreen(<UserProfileScreen />);
    expect(await screen.findByText('4,5 de 5')).toBeTruthy();
    expect(screen.getByText('2 calificaciones')).toBeTruthy();
    expect(screen.getByText('Muy puntual')).toBeTruthy();
    expect(screen.queryByText('Calificar')).toBeNull();
  });

  it('sin calificaciones muestra el estado vacío', async () => {
    mockParams = { id: 'u2' };
    mockApi({ '/users/u2/ratings': () => json(ratings({ average: null, count: 0, data: [] })) });
    await renderScreen(<UserProfileScreen />);
    expect(await screen.findByText('Sin calificaciones')).toBeTruthy();
    expect(screen.getByLabelText('Carlos Ruiz aún no tiene calificaciones')).toBeTruthy();
  });

  it('con groupId ofrece calificar y reportar', async () => {
    mockParams = { id: 'u2', groupId: 'g1' };
    mockApi({ '/users/u2/ratings': () => json(ratings()) });
    await renderScreen(<UserProfileScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Calificar' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ratings/create',
      params: { toId: 'u2', groupId: 'g1', name: 'Carlos Ruiz' },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Reportar usuario' }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/reports/create',
      params: { reportedId: 'u2', groupId: 'g1', name: 'Carlos Ruiz' },
    });
  });

  it('muestra el error del servidor', async () => {
    mockParams = { id: 'zz' };
    mockApi({ '/users/zz/ratings': () => json({ error: { message: 'No encontrado' } }, 404) });
    await renderScreen(<UserProfileScreen />);
    expect(await screen.findByText('No encontrado')).toBeTruthy();
  });
});

describe('Calificar usuario', () => {
  beforeEach(() => {
    mockParams = { toId: 'u2', groupId: 'g1', name: 'Carlos Ruiz' };
  });

  it('exige elegir estrellas antes de enviar', async () => {
    const calls = mockApi({});
    await renderScreen(<RateUserScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar calificación' }));
    expect(await screen.findByText('Elige de 1 a 5 estrellas')).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('envía puntaje y comentario y vuelve', async () => {
    const calls = mockApi({ '/ratings': () => json({ rating: { id: 'r1' } }, 201) });
    await renderScreen(<RateUserScreen />);
    await fireEvent.press(screen.getByLabelText('4 estrellas'));
    await fireEvent.changeText(screen.getByLabelText('Comentario (opcional)'), ' Muy amable ');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar calificación' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(JSON.parse(calls[0].body!)).toEqual({ groupId: 'g1', toId: 'u2', score: 4, comment: 'Muy amable' });
  });

  it('muestra el error si no es elegible', async () => {
    mockApi({ '/ratings': () => json({ error: { code: 'rating/not-eligible', message: 'No puedes calificar aún' } }, 403) });
    await renderScreen(<RateUserScreen />);
    await fireEvent.press(screen.getByLabelText('5 estrellas'));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar calificación' }));
    expect(await screen.findByText('No puedes calificar aún')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('Reportar usuario', () => {
  beforeEach(() => {
    mockParams = { reportedId: 'u2', groupId: 'g1', name: 'Carlos Ruiz' };
  });

  it('exige un motivo', async () => {
    const calls = mockApi({});
    await renderScreen(<ReportUserScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(await screen.findByText('Elige un motivo')).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('envía el reporte y confirma', async () => {
    const calls = mockApi({ '/reports': () => json({ report: { id: 'x' } }, 201) });
    await renderScreen(<ReportUserScreen />);
    await fireEvent.press(screen.getByLabelText('No dio acceso al servicio'));
    await fireEvent.changeText(screen.getByLabelText('Detalles (opcional)'), 'Pasó una semana');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(await screen.findByText('Reporte enviado')).toBeTruthy();
    expect(JSON.parse(calls[0].body!)).toEqual({
      groupId: 'g1',
      reportedId: 'u2',
      reason: 'No dio acceso al servicio',
      detail: 'Pasó una semana',
    });
  });

  it('muestra el error del servidor', async () => {
    mockApi({ '/reports': () => json({ error: { message: 'No tienes permiso para esto' } }, 403) });
    await renderScreen(<ReportUserScreen />);
    await fireEvent.press(screen.getByLabelText('Otro'));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(await screen.findByText('No tienes permiso para esto')).toBeTruthy();
  });
});
