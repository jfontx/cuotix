import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';
import { store } from '@/store';
import { fieldErrors, loginSchema, registerSchema } from '@/lib/validation';

// expo-router carga módulos ESM que jest no transforma; solo se necesita Link
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/secure-storage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(async () => null),
    setRefreshToken: jest.fn(async () => undefined),
    clearRefreshToken: jest.fn(async () => undefined),
  },
}));

const renderScreen = async (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('validación', () => {
  it('registerSchema exige nombre, correo válido y contraseña de 8+', () => {
    const r = registerSchema.safeParse({ name: '', email: 'x', phone: '', password: '123' });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(['email', 'name', 'password']);
    expect(loginSchema.safeParse({ email: 'A@B.co', password: 'x' }).data?.email).toBe('a@b.co');
  });
});

describe('LoginScreen', () => {
  it('muestra errores de validación sin llamar al servidor', async () => {
    global.fetch = jest.fn() as typeof fetch;
    await renderScreen(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Ingresa un correo válido')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('muestra el mensaje del servidor ante credenciales inválidas', async () => {
    global.fetch = jest.fn(async () =>
      json({ error: { code: 'auth/invalid-credentials', message: 'Correo o contraseña incorrectos' } }, 401),
    ) as typeof fetch;
    await renderScreen(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'a@b.co');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'mala-clave');
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeTruthy();
  });

  it('con credenciales válidas inicia la sesión en el store', async () => {
    const user = { id: 'u1', email: 'a@b.co', name: 'Ana', phone: null, role: 'USER', createdAt: '2026-11-12' };
    global.fetch = jest.fn(async () => json({ user, accessToken: 'a', refreshToken: 'r' })) as typeof fetch;
    await renderScreen(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'a@b.co');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Password123!');
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
  });
});

describe('RegisterScreen', () => {
  it('valida los campos antes de enviar', async () => {
    global.fetch = jest.fn() as typeof fetch;
    await renderScreen(<RegisterScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('muestra el error de correo ya registrado', async () => {
    global.fetch = jest.fn(async () =>
      json({ error: { code: 'auth/email-exists', message: 'Este correo ya está registrado' } }, 409),
    ) as typeof fetch;
    await renderScreen(<RegisterScreen />);
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'a@b.co');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Password123!');
    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Este correo ya está registrado')).toBeTruthy();
  });
});
