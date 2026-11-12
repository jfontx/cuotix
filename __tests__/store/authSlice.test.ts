import authReducer, {
  clearCredentials,
  selectIsAuthenticated,
  setCredentials,
  setUser,
  type AuthState,
  type AuthUser,
} from '@/store/authSlice';

const user: AuthUser = {
  id: 'u1',
  email: 'a@b.co',
  name: 'Ana',
  phone: null,
  role: 'USER',
  createdAt: '2026-11-12T00:00:00.000Z',
};
const initial = authReducer(undefined, { type: 'init' });

describe('authSlice', () => {
  it('inicia en estado loading sin sesión', () => {
    expect(initial).toEqual({ user: null, accessToken: null, refreshToken: null, status: 'loading' });
  });

  it('setCredentials guarda usuario y tokens', () => {
    const state = authReducer(initial, setCredentials({ user, accessToken: 'a', refreshToken: 'r' }));
    expect(state).toEqual({ user, accessToken: 'a', refreshToken: 'r', status: 'authenticated' });
  });

  it('setCredentials sin usuario (rotación) conserva el usuario actual', () => {
    const logged = authReducer(initial, setCredentials({ user, accessToken: 'a', refreshToken: 'r' }));
    const state = authReducer(logged, setCredentials({ accessToken: 'a2', refreshToken: 'r2' }));
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('a2');
  });

  it('setUser actualiza el perfil', () => {
    const state = authReducer(initial, setUser(user));
    expect(state.user).toEqual(user);
  });

  it('clearCredentials limpia el estado', () => {
    const logged = authReducer(initial, setCredentials({ user, accessToken: 'a', refreshToken: 'r' }));
    expect(authReducer(logged, clearCredentials())).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
    });
  });

  it('selectIsAuthenticated retorna correcto', () => {
    const wrap = (auth: AuthState) => ({ auth });
    expect(selectIsAuthenticated(wrap(initial))).toBe(false);
    const logged = authReducer(initial, setCredentials({ user, accessToken: 'a', refreshToken: 'r' }));
    expect(selectIsAuthenticated(wrap(logged))).toBe(true);
    expect(selectIsAuthenticated(wrap(authReducer(logged, clearCredentials())))).toBe(false);
  });
});
