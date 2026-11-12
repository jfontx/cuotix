import { api } from './api';
import type { AuthUser, Credentials } from './authSlice';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

type SessionResponse = Credentials & { user: AuthUser };

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<SessionResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<SessionResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<void, { refreshToken: string; pushToken?: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),
    getMe: build.query<{ user: AuthUser }, void>({
      query: () => '/me',
      providesTags: ['User'],
    }),
    updateMe: build.mutation<{ user: AuthUser }, Partial<Pick<AuthUser, 'name' | 'phone'>>>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery, useUpdateMeMutation } =
  authApi;
