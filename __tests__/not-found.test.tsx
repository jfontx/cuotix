import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import NotFoundScreen from '@/app/+not-found';
import { store } from '@/store';
import { clearCredentials, setCredentials } from '@/store/authSlice';

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

const renderScreen = () =>
  render(
    <Provider store={store}>
      <NotFoundScreen />
    </Provider>,
  );

describe('+not-found', () => {
  beforeEach(() => mockRedirect.mockClear());

  it('sin sesión redirige al login', async () => {
    store.dispatch(clearCredentials());
    await renderScreen();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('con sesión muestra el aviso y no redirige', async () => {
    store.dispatch(
      setCredentials({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1', name: 'Ana', email: 'a@x.co' } } as never),
    );
    const { getByText } = await renderScreen();
    expect(getByText('Esta pantalla no existe')).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
    store.dispatch(clearCredentials());
  });
});
