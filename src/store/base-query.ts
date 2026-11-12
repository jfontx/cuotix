import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

import { secureStorage } from '@/lib/secure-storage';

import {
  clearCredentials,
  selectAccessToken,
  selectRefreshToken,
  setCredentials,
  type AuthState,
  type Credentials,
} from './authSlice';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as { auth: AuthState });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const url = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

/** Una sola renovación en vuelo: las demás peticiones 401 esperan el mismo resultado. */
let refreshing: Promise<boolean> | null = null;

/** Rota los tokens con la sesión guardada. Retorna false (y cierra sesión) si falla. */
export function refreshSession(
  getState: () => unknown,
  dispatch: (action: unknown) => unknown,
): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken =
      selectRefreshToken(getState() as { auth: AuthState }) ?? (await secureStorage.getRefreshToken());
    const expire = async () => {
      await secureStorage.clearRefreshToken();
      dispatch(clearCredentials());
      return false;
    };
    if (!refreshToken) return expire();

    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return false; // sin red: no se descarta la sesión guardada
    }
    if (!res.ok) return expire();

    const tokens = (await res.json()) as Credentials;
    await secureStorage.setRefreshToken(tokens.refreshToken);
    dispatch(setCredentials(tokens));
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Reintenta una vez la petición tras renovar el access token cuando responde 401. */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && !url(args).startsWith('/auth/')) {
    if (await refreshSession(api.getState, api.dispatch)) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }
  return result;
};
