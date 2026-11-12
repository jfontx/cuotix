import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { store } from '@/store';

describe('mobile setup', () => {
  it('renderiza la pantalla inicial sin errores', () => {
    expect(() => render(<HomeScreen />)).not.toThrow();
  });

  it('el store de Redux expone el reducer de la API', () => {
    expect(store.getState()).toHaveProperty('api');
  });
});
