import { api } from './api';

export type PaymentCycleStatus = 'PENDING' | 'MARKED_PAID' | 'CONFIRMED' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: string;
  membershipId: string;
  /** `YYYY-MM` */
  period: string;
  amount: number;
  dueDate: string;
  status: PaymentCycleStatus;
  reference: string | null;
  markedPaidAt: string | null;
  confirmedAt: string | null;
  rejectionReason: string | null;
  overdueAt: string | null;
  group: { id: string; title: string; payoutMethod: string; service: { name: string } };
  member: { id: string; name: string };
}

export interface PaymentDetail extends Payment {
  /** Solo el administrador y los miembros con cupo lo reciben (no quien ya salió o fue removido) */
  payoutDetail?: string;
}

type PaymentResponse = { payment: Payment };

const paymentTags = (id: string) => [{ type: 'Payment' as const, id }, { type: 'Payment' as const, id: 'LIST' }];

export const paymentsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMyPayments: build.query<{ data: Payment[] }, void>({
      query: () => '/me/payments',
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    listGroupPayments: build.query<{ data: Payment[] }, string>({
      query: (groupId) => `/groups/${groupId}/payments`,
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    getPayment: build.query<{ payment: PaymentDetail }, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Payment', id }],
    }),
    markPaid: build.mutation<PaymentResponse, { id: string; reference?: string }>({
      query: ({ id, reference }) => ({ url: `/payments/${id}/mark-paid`, method: 'POST', body: { reference } }),
      invalidatesTags: (_r, _e, { id }) => paymentTags(id),
    }),
    confirmPayment: build.mutation<PaymentResponse, string>({
      query: (id) => ({ url: `/payments/${id}/confirm`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => paymentTags(id),
    }),
    rejectPayment: build.mutation<PaymentResponse, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/payments/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => paymentTags(id),
    }),
  }),
});

export const {
  useListMyPaymentsQuery,
  useListGroupPaymentsQuery,
  useGetPaymentQuery,
  useMarkPaidMutation,
  useConfirmPaymentMutation,
  useRejectPaymentMutation,
} = paymentsApi;
