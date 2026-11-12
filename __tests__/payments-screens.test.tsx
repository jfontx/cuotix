import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import GroupPaymentsScreen from '@/app/(app)/groups/[id]/payments';
import MarkPaidScreen from '@/app/(app)/payments/mark-paid';
import PaymentDetailScreen from '@/app/(app)/payments/[id]';
import MyPaymentsScreen from '@/app/(app)/payments';
import { PaymentCard } from '@/components/payment-card';
import { formatDueDate, monthName, periodTitle } from '@/lib/payments';
import { store } from '@/store';
import { api } from '@/store/api';
import { clearCredentials, setCredentials } from '@/store/authSlice';
import type { Payment, PaymentDetail } from '@/store/paymentsApi';

import { makeGroup } from './components/group-card.test';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParamId = 'p1';
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: mockParamId }),
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

const payment = (over: Partial<Payment> = {}): Payment => ({
  id: 'p1',
  membershipId: 'm1',
  period: '2026-11',
  amount: 8000,
  dueDate: '2026-11-15T05:00:00.000Z',
  status: 'PENDING',
  reference: null,
  markedPaidAt: null,
  confirmedAt: null,
  rejectionReason: null,
  overdueAt: null,
  group: { id: 'g1', title: 'Spotify Familiar', payoutMethod: 'Nequi', service: { name: 'Spotify' } },
  member: { id: 'u1', name: 'Ana Pérez' },
  ...over,
});

const detail = (over: Partial<PaymentDetail> = {}): PaymentDetail => ({
  ...payment(),
  payoutDetail: '3001234567',
  ...over,
});

const signIn = (id: string) =>
  store.dispatch(
    setCredentials({
      user: { id, email: 'a@b.co', name: 'Ana Pérez', phone: null } as never,
      accessToken: 't',
      refreshToken: 'r',
    } as never),
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockParamId = 'p1';
  store.dispatch(api.util.resetApiState());
  store.dispatch(clearCredentials());
});

describe('helpers de cuotas', () => {
  it('formatea período y vencimiento en horario de Bogotá', () => {
    expect(monthName('2026-11')).toBe('noviembre');
    expect(periodTitle('2026-01')).toBe('Cuota enero');
    // 00:00 en Bogotá = 05:00 UTC
    expect(formatDueDate('2026-11-15T05:00:00.000Z')).toBe('15 de noviembre de 2026');
    expect(formatDueDate('2026-12-01T05:00:00.000Z')).toBe('1 de diciembre de 2026');
  });
});

describe('PaymentCard', () => {
  it('describe la cuota completa en su etiqueta de accesibilidad', async () => {
    const onPress = jest.fn();
    await renderScreen(<PaymentCard payment={payment()} onPress={onPress} />);
    const card = screen.getByLabelText(
      'Cuota noviembre, Spotify Familiar. $8.000. Pendiente. Vence el 15 de noviembre de 2026.',
    );
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('muestra al miembro en la vista del administrador', async () => {
    await renderScreen(<PaymentCard payment={payment({ status: 'MARKED_PAID' })} showMember />);
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Marcado como pagado')).toBeTruthy();
  });
});

describe('listas de cuotas', () => {
  it('Mis cuotas lista y abre el detalle', async () => {
    mockApi({ '/me/payments': () => json({ data: [payment()] }) });
    await renderScreen(<MyPaymentsScreen />);
    await fireEvent.press(await screen.findByLabelText(/^Cuota noviembre/));
    expect(mockPush).toHaveBeenCalledWith('/payments/p1');
  });

  it('Mis cuotas muestra el estado vacío', async () => {
    mockApi({ '/me/payments': () => json({ data: [] }) });
    await renderScreen(<MyPaymentsScreen />);
    expect(await screen.findByText('Aún no tienes cuotas')).toBeTruthy();
  });

  it('el administrador ve las cuotas de todos los miembros del grupo', async () => {
    mockParamId = 'g1';
    const calls = mockApi({
      '/groups/g1/payments': () => json({ data: [payment({ id: 'p1' }), payment({ id: 'p2', member: { id: 'u2', name: 'Luis Gómez' } })] }),
      '/groups/g1': () => json({ group: { ...makeGroup(), isOwner: true, myMembership: null } }),
    });
    await renderScreen(<GroupPaymentsScreen />);
    expect(await screen.findByText('Luis Gómez')).toBeTruthy();
    expect(calls.some((c) => c.url.startsWith('/me/payments'))).toBe(false);
  });
});

describe('PaymentDetailScreen', () => {
  it('el pagador ve los datos de pago y va a marcar como pagado', async () => {
    signIn('u1');
    mockApi({ '/payments/p1': () => json({ payment: detail() }) });
    await renderScreen(<PaymentDetailScreen />);
    expect(await screen.findByText('3001234567')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirmar pago' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Ya pagué' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/payments/mark-paid', params: { id: 'p1' } });
  });

  it('muestra el motivo si el administrador rechazó el pago', async () => {
    signIn('u1');
    mockApi({ '/payments/p1': () => json({ payment: detail({ rejectionReason: 'No llegó la transferencia' }) }) });
    await renderScreen(<PaymentDetailScreen />);
    expect(await screen.findByText(/No llegó la transferencia/)).toBeTruthy();
  });

  it('el pagador espera la confirmación cuando ya marcó el pago', async () => {
    signIn('u1');
    mockApi({ '/payments/p1': () => json({ payment: detail({ status: 'MARKED_PAID' }) }) });
    await renderScreen(<PaymentDetailScreen />);
    expect(await screen.findByText('Esperando que el administrador confirme tu pago.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ya pagué' })).toBeNull();
  });

  it('el administrador confirma el pago', async () => {
    signIn('owner');
    const calls = mockApi({
      '/payments/p1/confirm': () => json({ payment: payment({ status: 'CONFIRMED' }) }),
      '/payments/p1': () => json({ payment: detail({ status: 'MARKED_PAID' }) }),
    });
    await renderScreen(<PaymentDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Confirmar pago' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/payments/p1/confirm' && c.method === 'POST')).toBe(true));
  });

  it('el administrador exige un motivo de al menos 10 caracteres para rechazar', async () => {
    signIn('owner');
    const calls = mockApi({
      '/payments/p1/reject': () => json({ payment: payment() }),
      '/payments/p1': () => json({ payment: detail({ status: 'MARKED_PAID' }) }),
    });
    await renderScreen(<PaymentDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Rechazar pago' }));
    await fireEvent.changeText(screen.getByLabelText('Motivo, requerido'), 'corto');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Rechazar pago' }).at(-1)!);
    expect(await screen.findByText(/Escribe al menos 10 caracteres/)).toBeTruthy();
    expect(calls.some((c) => c.url === '/payments/p1/reject')).toBe(false);

    await fireEvent.changeText(screen.getByLabelText('Motivo, requerido'), 'No encontré la transferencia');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Rechazar pago' }).at(-1)!);
    await waitFor(() => expect(calls.some((c) => c.url === '/payments/p1/reject')).toBe(true));
    expect(JSON.parse(calls.find((c) => c.url === '/payments/p1/reject')!.body!)).toEqual({
      reason: 'No encontré la transferencia',
    });
  });
});

describe('MarkPaidScreen', () => {
  it('envía la referencia y vuelve', async () => {
    const calls = mockApi({
      '/payments/p1/mark-paid': () => json({ payment: payment({ status: 'MARKED_PAID' }) }),
      '/payments/p1': () => json({ payment: detail() }),
    });
    await renderScreen(<MarkPaidScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Referencia (opcional)'), '1234');
    await fireEvent.press(screen.getByRole('button', { name: 'Ya pagué' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const call = calls.find((c) => c.url === '/payments/p1/mark-paid')!;
    expect(call.method).toBe('POST');
    expect(JSON.parse(call.body!)).toEqual({ reference: '1234' });
  });

  it('muestra el error del servidor y no vuelve', async () => {
    mockApi({
      '/payments/p1/mark-paid': () =>
        json({ error: { code: 'payment/already-confirmed', message: 'Este pago ya fue confirmado' } }, 409),
      '/payments/p1': () => json({ payment: detail() }),
    });
    await renderScreen(<MarkPaidScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Ya pagué' }));
    expect(await screen.findByText('Este pago ya fue confirmado')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('no permite marcar una cuota que ya no está pendiente', async () => {
    mockApi({ '/payments/p1': () => json({ payment: detail({ status: 'CONFIRMED' }) }) });
    await renderScreen(<MarkPaidScreen />);
    expect(await screen.findByText('Esta cuota ya no se puede marcar como pagada.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ya pagué' })).toBeNull();
  });
});
