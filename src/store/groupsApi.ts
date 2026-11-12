import { api } from './api';

export type GroupStatus = 'OPEN' | 'FULL' | 'PAUSED' | 'CLOSED';
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'LEFT' | 'REMOVED';

export interface Service {
  id: string;
  name: string;
  planType: string;
  maxMembers: number;
  allowsOutOfHome: boolean;
  notes: string | null;
  lastReviewedAt: string;
}

export interface GroupSummary {
  id: string;
  ownerId: string;
  serviceId: string;
  title: string;
  description: string | null;
  pricePerMember: number;
  paymentDay: number;
  slots: number;
  status: GroupStatus;
  payoutMethod: string;
  createdAt: string;
  service: Service;
  owner: { id: string; name: string };
  occupiedSlots: number;
  availableSlots: number;
}

export interface GroupDetail extends GroupSummary {
  isOwner: boolean;
  myMembership: { id: string; status: MembershipStatus } | null;
  /** Solo lo envía el servidor al administrador y a miembros aprobados/activos */
  payoutDetail?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListGroupsArgs {
  serviceId?: string;
  status?: GroupStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  excludeMine?: boolean;
  mine?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateGroupRequest {
  serviceId: string;
  title: string;
  description?: string;
  pricePerMember: number;
  paymentDay: number;
  slots: number;
  payoutMethod: string;
  payoutDetail: string;
}

export type UpdateGroupRequest = Partial<Omit<CreateGroupRequest, 'serviceId'>> & { status?: 'OPEN' | 'PAUSED' };

export const groupsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listServices: build.query<{ data: Service[] }, void>({
      query: () => '/services',
      providesTags: ['Service'],
    }),
    getService: build.query<{ service: Service }, string>({
      query: (id) => `/services/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Service', id }],
    }),
    listGroups: build.query<{ data: GroupSummary[]; pagination: Pagination }, ListGroupsArgs | void>({
      query: (params) => ({ url: '/groups', params: params ?? undefined }),
      providesTags: (result) => [
        { type: 'Group', id: 'LIST' },
        ...(result?.data ?? []).map(({ id }) => ({ type: 'Group' as const, id })),
      ],
    }),
    getGroup: build.query<{ group: GroupDetail }, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Group', id }],
    }),
    createGroup: build.mutation<{ group: GroupDetail }, CreateGroupRequest>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
    updateGroup: build.mutation<{ group: GroupDetail }, { id: string; changes: UpdateGroupRequest }>({
      query: ({ id, changes }) => ({ url: `/groups/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Group', id }, { type: 'Group', id: 'LIST' }],
    }),
    closeGroup: build.mutation<{ group: GroupDetail }, string>({
      query: (id) => ({ url: `/groups/${id}/close`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Group', id }, { type: 'Group', id: 'LIST' }],
    }),
  }),
});

export const {
  useListServicesQuery,
  useGetServiceQuery,
  useListGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useCloseGroupMutation,
} = groupsApi;
