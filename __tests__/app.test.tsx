import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import HomeScreen from '@/app/(app)/(tabs)/index';
import { store } from '@/store';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('mobile setup', () => {
  it('renderiza la pantalla inicial sin errores', async () => {
    global.fetch = jest.fn(
      async () => new Response(JSON.stringify({ data: [], pagination: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ) as typeof fetch;
    await expect(
      render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>,
      ),
    ).resolves.toBeDefined();
  });

  it('el store de Redux expone el reducer de la API y de auth', () => {
    expect(store.getState()).toHaveProperty('api');
    expect(store.getState()).toHaveProperty('auth');
  });
});
