import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from './base-query';

export { API_URL } from './base-query';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Group', 'Membership', 'Payment', 'Rating', 'Service', 'Notification'],
  endpoints: () => ({}),
});
