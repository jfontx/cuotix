import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['User', 'Group', 'Membership', 'Payment', 'Rating', 'Service', 'Notification'],
  endpoints: () => ({}),
});
