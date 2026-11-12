import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  /** Solo en memoria; el refresh token vive en expo-secure-store */
  accessToken: string | null;
  refreshToken: string | null;
  /** `loading` mientras se restaura la sesión al abrir la app */
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'loading',
};

export interface Credentials {
  user?: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, { payload }: PayloadAction<Credentials>) {
      if (payload.user) state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.status = 'authenticated';
    },
    setUser(state, { payload }: PayloadAction<AuthUser>) {
      state.user = payload;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setCredentials, setUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

type WithAuth = { auth: AuthState };

export const selectIsAuthenticated = (state: WithAuth) =>
  state.auth.status === 'authenticated' && state.auth.accessToken !== null;
export const selectAuthStatus = (state: WithAuth) => state.auth.status;
export const selectCurrentUser = (state: WithAuth) => state.auth.user;
export const selectAccessToken = (state: WithAuth) => state.auth.accessToken;
export const selectRefreshToken = (state: WithAuth) => state.auth.refreshToken;
