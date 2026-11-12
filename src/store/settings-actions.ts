import { secureStorage } from '@/lib/secure-storage';

import type { AppDispatch, RootState } from '.';
import { hydrateSettings, selectSettings, type SettingsState } from './settingsSlice';

/** Carga las preferencias guardadas; si no hay o están dañadas, se conservan los valores por defecto. */
export const loadSettings = () => async (dispatch: AppDispatch) => {
  try {
    const raw = await secureStorage.getSettings();
    if (raw) dispatch(hydrateSettings(JSON.parse(raw) as Partial<SettingsState>));
  } catch {
    // preferencias ilegibles: se usan las predeterminadas
  }
};

/** Guarda las preferencias cada vez que cambian. Devuelve la función para cancelar la suscripción. */
export function startSettingsPersistence(store: {
  getState: () => Pick<RootState, 'settings'>;
  subscribe: (l: () => void) => () => void;
}) {
  let last = selectSettings(store.getState());
  return store.subscribe(() => {
    const next = selectSettings(store.getState());
    if (next === last) return;
    last = next;
    secureStorage.setSettings(JSON.stringify(next)).catch(() => undefined);
  });
}
