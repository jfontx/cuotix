import { api } from './api';

export type NotificationType =
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_MARKED_PAID'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'JOIN_REQUEST'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_REJECTED'
  | 'ACCESS_CONFIRMED'
  | 'GROUP_CLOSED'
  | 'MEMBER_REMOVED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  paymentId: string | null;
  data: { groupId?: string; paymentId?: string; membershipId?: string } | null;
  read: boolean;
  sentAt: string;
}

export interface NotificationsPage {
  data: AppNotification[];
  page: number;
  limit: number;
  total: number;
  unread: number;
}

const LIST = { type: 'Notification' as const, id: 'LIST' };

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<NotificationsPage, void>({
      query: () => '/me/notifications?limit=50',
      providesTags: [LIST],
    }),
    markNotificationRead: build.mutation<{ notification: AppNotification }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [LIST],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: '/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: [LIST],
    }),
    registerPushToken: build.mutation<void, { token: string; platform: 'ios' | 'android' | 'web' }>({
      query: (body) => ({ url: '/me/push-token', method: 'POST', body }),
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useRegisterPushTokenMutation,
} = notificationsApi;
