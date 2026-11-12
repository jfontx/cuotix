import { secureStorage } from '@/lib/secure-storage';

import { api } from './api';
import { authApi } from './authApi';
import { clearCredentials, selectRefreshToken, setCredentials, setUser, type Credentials } from './authSlice';
import { refreshSession } from './base-query';
import type { AppDispatch, RootState } from './index';

type Thunk<T = void> = (dispatch: AppDispatch, getState: () => RootState) => Promise<T>;

/** Guarda la sesión recién obtenida (login/registro) en memoria y en secure-store. */
export const startSession =
  (credentials: Credentials): Thunk =>
  async (dispatch) => {
    await secureStorage.setRefreshToken(credentials.refreshToken);
    dispatch(setCredentials(credentials));
  };

/** Restaura la sesión al abrir la app a partir del refresh token guardado. */
export const restoreSession = (): Thunk => async (dispatch, getState) => {
  const stored = await secureStorage.getRefreshToken();
  if (!stored) {
    dispatch(clearCredentials());
    return;
  }
  if (!(await refreshSession(getState, dispatch as (a: unknown) => unknown))) {
    // Sin red: no hay forma de validar la sesión, se pide iniciar de nuevo
    dispatch(clearCredentials());
    return;
  }
  const me = await dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
  if (me.data) dispatch(setUser(me.data.user));
};

/** Cierra sesión: invalida el refresh token en el servidor, limpia el dispositivo y la caché. */
export const logout = (): Thunk => async (dispatch, getState) => {
  const refreshToken = selectRefreshToken(getState()) ?? (await secureStorage.getRefreshToken());
  if (refreshToken) {
    // Si falla (sin red) igual se cierra la sesión localmente
    await dispatch(authApi.endpoints.logout.initiate({ refreshToken })).unwrap().catch(() => undefined);
  }
  await secureStorage.clearRefreshToken();
  dispatch(clearCredentials());
  dispatch(api.util.resetApiState());
};
