import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import HomeScreen from '@/app/(app)/index';
import { store } from '@/store';

describe('mobile setup', () => {
  it('renderiza la pantalla inicial sin errores', async () => {
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
