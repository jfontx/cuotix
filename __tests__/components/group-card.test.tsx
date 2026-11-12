import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { GroupCard } from '@/components/group-card';
import { AppChip, AppEmptyState, AppList } from '@/components/ui';
import { formatCop, slotsLabel } from '@/lib/format';
import { store } from '@/store';
import type { GroupSummary } from '@/store/groupsApi';

const wrap = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

export const makeGroup = (over: Partial<GroupSummary> = {}): GroupSummary => ({
  id: 'g1',
  ownerId: 'o1',
  serviceId: 's1',
  title: 'Spotify del barrio',
  description: null,
  pricePerMember: 8000,
  paymentDay: 15,
  slots: 4,
  status: 'OPEN',
  payoutMethod: 'nequi',
  createdAt: '2026-11-12T00:00:00.000Z',
  service: {
    id: 's1',
    name: 'Spotify Premium Familiar',
    planType: 'familiar',
    maxMembers: 6,
    allowsOutOfHome: false,
    notes: null,
    lastReviewedAt: '2026-11-12T00:00:00.000Z',
  },
  owner: { id: 'o1', name: 'Jorge' },
  occupiedSlots: 2,
  availableSlots: 2,
  ...over,
});

describe('GroupCard', () => {
  it('muestra nombre del servicio', async () => {
    await wrap(<GroupCard group={makeGroup()} onPress={jest.fn()} />);
    expect(screen.getByText('Spotify Premium Familiar')).toBeTruthy();
    expect(screen.getByText('Spotify del barrio')).toBeTruthy();
  });

  it('muestra slots disponibles', async () => {
    await wrap(<GroupCard group={makeGroup({ availableSlots: 2 })} onPress={jest.fn()} />);
    expect(screen.getByText('2 cupos disponibles')).toBeTruthy();
  });

  it('usa singular con un cupo y avisa cuando no quedan', async () => {
    await wrap(<GroupCard group={makeGroup({ availableSlots: 1 })} onPress={jest.fn()} />);
    expect(screen.getByText('1 cupo disponible')).toBeTruthy();
    await wrap(<GroupCard group={makeGroup({ availableSlots: 0, status: 'FULL' })} onPress={jest.fn()} />);
    expect(screen.getByText('Sin cupos disponibles')).toBeTruthy();
    expect(screen.getByText('Completo')).toBeTruthy();
  });

  it('muestra precio', async () => {
    await wrap(<GroupCard group={makeGroup({ pricePerMember: 12500 })} onPress={jest.fn()} />);
    expect(screen.getByText('$12.500 al mes')).toBeTruthy();
  });

  it('accessibilityLabel descriptivo completo y rol button', async () => {
    await wrap(<GroupCard group={makeGroup()} onPress={jest.fn()} />);
    const card = screen.getByRole('button');
    expect(card.props.accessibilityLabel).toBe(
      'Spotify Premium Familiar. Spotify del barrio. $8.000 al mes. 2 cupos disponibles. Administrador Jorge',
    );
  });

  it('ejecuta onPress', async () => {
    const onPress = jest.fn();
    await wrap(<GroupCard group={makeGroup()} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('showOwner=false oculta al administrador', async () => {
    await wrap(<GroupCard group={makeGroup()} onPress={jest.fn()} showOwner={false} />);
    expect(screen.queryByText(/Administra/)).toBeNull();
    expect(screen.getByRole('button').props.accessibilityLabel).not.toContain('Administrador');
  });
});

describe('format', () => {
  it('formatCop agrupa miles con punto', () => {
    expect(formatCop(0)).toBe('$0');
    expect(formatCop(950)).toBe('$950');
    expect(formatCop(8000)).toBe('$8.000');
    expect(formatCop(1234567)).toBe('$1.234.567');
  });
  it('slotsLabel', () => {
    expect(slotsLabel(3)).toBe('3 cupos disponibles');
  });
});

describe('AppChip', () => {
  it('comunica selección con estado y no solo con color', async () => {
    const onPress = jest.fn();
    await wrap(<AppChip label="Spotify" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Spotify' });
    expect(chip.props.accessibilityState.selected).toBe(true);
    expect(screen.getByText('✓ Spotify')).toBeTruthy();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('AppEmptyState / AppList', () => {
  it('AppEmptyState anuncia título y mensaje y ofrece acción', async () => {
    const onAction = jest.fn();
    await wrap(<AppEmptyState title="Sin grupos" message="Crea uno" actionLabel="Crear" onAction={onAction} />);
    expect(screen.getByLabelText('Sin grupos. Crea uno')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('AppList muestra el estado vacío', async () => {
    await wrap(<AppList data={[]} renderItem={() => null} empty={{ title: 'Nada por aquí' }} />);
    expect(screen.getByText('Nada por aquí')).toBeTruthy();
  });
});
