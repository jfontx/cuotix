import { api } from './api';

export interface RatingEntry {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  group: { id: string; title: string };
  from: { id: string; name: string };
}

export interface UserRatings {
  user: { id: string; name: string };
  /** `null` si aún no tiene calificaciones */
  average: number | null;
  count: number;
  data: RatingEntry[];
  page: number;
  limit: number;
}

export interface CreateRatingRequest {
  groupId: string;
  toId: string;
  score: number;
  comment?: string;
}

export interface CreateReportRequest {
  groupId: string;
  reportedId: string;
  reason: string;
  detail?: string;
}

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export interface Report {
  id: string;
  groupId: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
  group: { id: string; title: string };
  reporter: { id: string; name: string };
  reported: { id: string; name: string };
}

export const ratingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserRatings: build.query<UserRatings, string>({
      query: (userId) => `/users/${userId}/ratings?limit=50`,
      providesTags: (_r, _e, userId) => [{ type: 'Rating', id: userId }],
    }),
    createRating: build.mutation<{ rating: { id: string } }, CreateRatingRequest>({
      query: (body) => ({ url: '/ratings', method: 'POST', body }),
      invalidatesTags: (_r, _e, { toId }) => [{ type: 'Rating', id: toId }],
    }),
    createReport: build.mutation<{ report: { id: string } }, CreateReportRequest>({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
    }),
    listReports: build.query<{ data: Report[] }, ReportStatus | void>({
      query: (status) => (status ? `/reports?status=${status}` : '/reports'),
      providesTags: [{ type: 'Rating', id: 'REPORTS' }],
    }),
    updateReport: build.mutation<{ report: Report }, { id: string; status: ReportStatus }>({
      query: ({ id, status }) => ({ url: `/reports/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: [{ type: 'Rating', id: 'REPORTS' }],
    }),
  }),
});

export const {
  useGetUserRatingsQuery,
  useCreateRatingMutation,
  useCreateReportMutation,
  useListReportsQuery,
  useUpdateReportMutation,
} = ratingsApi;
