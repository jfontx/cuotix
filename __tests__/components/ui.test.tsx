import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Provider } from 'react-redux';

import { AppButton, AppCard, AppIcon, AppInput, AppModal, AppScreen, AppText, StatusBadge, STATUS_CONFIG } from '@/components/ui';
import { store } from '@/store';
import { setHighContrast, setTheme } from '@/store/settingsSlice';
import { darkColors, lightColors, ThemeProvider, useAppTheme, type PaymentStatus } from '@/theme';
import { textStyles } from '@/theme/typography';

import { flattenStyle } from '../helpers';

// Los iconos decorativos se ocultan a los lectores de pantalla; los queries deben incluirlos
const hiddenIcons = { includeHiddenElements: true };

const wrap = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

describe('AppButton', () => {
  it('tiene rol button y label con el título', async () => {
    await wrap(<AppButton title="Guardar" onPress={jest.fn()} />);
    const b = screen.getByRole('button', { name: 'Guardar' });
    expect(b.props.accessibilityLabel).toBe('Guardar');
  });

  it('marca disabled y no ejecuta onPress', async () => {
    const onPress = jest.fn();
    await wrap(<AppButton title="Guardar" onPress={onPress} disabled />);
    const b = screen.getByRole('button', { name: 'Guardar' });
    expect(b.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(b);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marca busy al cargar, no ejecuta onPress y anuncia Cargando', async () => {
    const onPress = jest.fn();
    await wrap(<AppButton title="Guardar" onPress={onPress} loading />);
    const b = screen.getByRole('button', { name: 'Guardar' });
    expect(b.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(screen.getByText('Cargando…')).toBeTruthy();
    await fireEvent.press(b);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ejecuta onPress y respeta altura mínima ≥48dp en todos los tamaños', async () => {
    const onPress = jest.fn();
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = await wrap(<AppButton title={`B-${size}`} onPress={onPress} size={size} />);
      const b = screen.getByRole('button', { name: `B-${size}` });
      expect(flattenStyle(b.props.style).minHeight).toBeGreaterThanOrEqual(48);
      await fireEvent.press(b);
      await unmount();
    }
    expect(onPress).toHaveBeenCalledTimes(3);
  });
});

describe('AppInput', () => {
  it('muestra label visible', async () => {
    await wrap(<AppInput label="Correo" />);
    expect(screen.getByText('Correo')).toBeTruthy();
  });

  it('incluye "requerido" en accessibilityLabel', async () => {
    await wrap(<AppInput label="Correo" required />);
    expect(screen.getByLabelText('Correo, requerido')).toBeTruthy();
  });

  it('muestra error con icono y texto en región live polite', async () => {
    await wrap(<AppInput label="Correo" error="Correo inválido" />);
    const text = screen.getByText('Correo inválido');
    expect(text).toBeTruthy();
    expect(screen.getAllByTestId('icon-error', hiddenIcons).length).toBe(1);
    expect(text.parent?.props.accessibilityLiveRegion).toBe('polite');
  });

  it('muestra hint y lo expone como accessibilityHint', async () => {
    await wrap(<AppInput label="Clave" hint="Mínimo 8 caracteres" />);
    expect(screen.getByText('Mínimo 8 caracteres')).toBeTruthy();
    expect(screen.getByLabelText('Clave').props.accessibilityHint).toBe('Mínimo 8 caracteres');
  });

  it('área táctil ≥48dp', async () => {
    await wrap(<AppInput label="Correo" />);
    expect(flattenStyle(screen.getByLabelText('Correo').props.style).minHeight).toBeGreaterThanOrEqual(48);
  });
});

describe('StatusBadge', () => {
  const statuses = Object.keys(STATUS_CONFIG) as PaymentStatus[];

  it.each(statuses)('muestra texto, icono y label para %s', async (status) => {
    await wrap(<StatusBadge status={status} />);
    const { label } = STATUS_CONFIG[status];
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getAllByTestId(`icon-${STATUS_CONFIG[status].icon}`, hiddenIcons).length).toBe(1);
    expect(screen.getByLabelText(label)).toBeTruthy();
  });

  it('usa un icono distinto por estado', () => {
    expect(new Set(statuses.map((s) => STATUS_CONFIG[s].icon)).size).toBe(statuses.length);
  });
});

describe('AppCard', () => {
  it('rol button si tiene onPress y ejecuta la acción', async () => {
    const onPress = jest.fn();
    await wrap(
      <AppCard accessibilityLabel="Grupo Spotify" onPress={onPress}>
        <Text>Spotify</Text>
      </AppCard>,
    );
    const c = screen.getByRole('button', { name: 'Grupo Spotify' });
    await fireEvent.press(c);
    expect(onPress).toHaveBeenCalled();
  });

  it('rol summary si no tiene onPress', async () => {
    await wrap(
      <AppCard accessibilityLabel="Resumen">
        <Text>x</Text>
      </AppCard>,
    );
    expect(screen.getByLabelText('Resumen').props.accessibilityRole).toBe('summary');
  });
});

describe('AppText', () => {
  it('allowFontScaling es true', async () => {
    await wrap(<AppText>Hola</AppText>);
    expect(screen.getByText('Hola').props.allowFontScaling).toBe(true);
  });

  it('aplica la variante', async () => {
    await wrap(<AppText variant="caption">Pie</AppText>);
    expect(flattenStyle(screen.getByText('Pie').props.style)).toMatchObject(textStyles.caption);
  });

  it('soporta accessibilityRole header (explícito y en h1–h3)', async () => {
    await wrap(
      <>
        <AppText accessibilityRole="header">A</AppText>
        <AppText variant="h2">B</AppText>
        <AppText>C</AppText>
      </>,
    );
    expect(screen.getByText('A').props.accessibilityRole).toBe('header');
    expect(screen.getByText('B').props.accessibilityRole).toBe('header');
    expect(screen.getByText('C').props.accessibilityRole).toBeUndefined();
  });
});

describe('AppScreen', () => {
  it('muestra loading con accessibilityLabel', async () => {
    await wrap(<AppScreen loading><Text>contenido</Text></AppScreen>);
    expect(screen.getByLabelText('Cargando')).toBeTruthy();
    expect(screen.queryByText('contenido')).toBeNull();
  });

  it('muestra error con accessibilityLiveRegion assertive y reintenta', async () => {
    const onRetry = jest.fn();
    await wrap(<AppScreen error="Sin conexión" onRetry={onRetry}><Text>contenido</Text></AppScreen>);
    expect(screen.getByText('Sin conexión').parent?.props.accessibilityLiveRegion).toBe('assertive');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('muestra título como header y el contenido', async () => {
    await wrap(<AppScreen title="Mis grupos"><Text>contenido</Text></AppScreen>);
    expect(screen.getByRole('header', { name: 'Mis grupos' })).toBeTruthy();
    expect(screen.getByText('contenido')).toBeTruthy();
  });
});

describe('AppModal', () => {
  it('muestra título y contenido, y se cierra con el botón', async () => {
    const onClose = jest.fn();
    await wrap(<AppModal visible onClose={onClose} title="Filtros"><Text>cuerpo</Text></AppModal>);
    expect(screen.getByText('Filtros')).toBeTruthy();
    expect(screen.getByText('cuerpo')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('modal-backdrop', hiddenIcons));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('no renderiza contenido si no es visible', async () => {
    await wrap(<AppModal visible={false} onClose={jest.fn()} title="Filtros"><Text>cuerpo</Text></AppModal>);
    expect(screen.queryByText('cuerpo')).toBeNull();
  });
});

describe('AppIcon', () => {
  it('es decorativo sin label y accesible con label', async () => {
    const { rerender } = await wrap(<AppIcon name="clock" />);
    expect(screen.queryByLabelText('Reloj')).toBeNull();
    expect(screen.getByTestId('icon-clock', hiddenIcons).props.accessible).toBe(false);
    await rerender(<Provider store={store}><AppIcon name="clock" accessibilityLabel="Reloj" /></Provider>);
    expect(screen.getByLabelText('Reloj')).toBeTruthy();
  });
});

describe('tema y settings', () => {
  function Probe() {
    const { colors, isDark, highContrast } = useAppTheme();
    return <Text testID="probe">{`${isDark}|${highContrast}|${colors.background}`}</Text>;
  }
  const probe = () => screen.getByTestId('probe').props.children;

  afterEach(async () => {
    await act(async () => {
      store.dispatch(setTheme('system'));
      store.dispatch(setHighContrast(false));
    });
  });

  it('settings tiene valores por defecto', () => {
    expect(store.getState().settings).toEqual({ theme: 'system', highContrast: false, haptics: true });
  });

  it('respeta la preferencia de tema light/dark y alto contraste', async () => {
    store.dispatch(setTheme('dark'));
    await wrap(<ThemeProvider><Probe /></ThemeProvider>);
    expect(probe()).toBe(`true|false|${darkColors.background}`);
    await act(async () => {
      store.dispatch(setTheme('light'));
      store.dispatch(setHighContrast(true));
    });
    expect(probe()).toBe('false|true|#FFFFFF');
  });

  it('light y dark definen los mismos tokens', () => {
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
  });
});

describe('AppScreen pull to refresh', () => {
  it('scrollable con onRefresh monta RefreshControl y lo dispara', async () => {
    const onRefresh = jest.fn();
    await wrap(
      <AppScreen scrollable refreshing={false} onRefresh={onRefresh}>
        <Text>Contenido</Text>
      </AppScreen>,
    );
    // El mock de ScrollView expone el RefreshControl como prop del nodo host
    const find = (node: any): any =>
      !node || typeof node === 'string' ? undefined : node.props?.refreshControl ?? [node.children ?? []].flat().map(find).find(Boolean);
    const refresh = find(screen.toJSON());
    expect(refresh).toBeTruthy();
    await act(async () => {
      refresh.props.onRefresh();
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
