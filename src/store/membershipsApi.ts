import { api } from './api';
import type { MembershipStatus } from './groupsApi';

export interface Member {
  id: string;
  status: MembershipStatus;
  joinedAt: string | null;
  user: { id: string; name: string };
  /** Solo lo envía el servidor al administrador */
  firstAmount?: number | null;
}

export interface Membership {
  id: string;
  groupId: string;
  userId: string;
  status: MembershipStatus;
  joinedAt: string | null;
  leavesAt: string | null;
  firstAmount: number | null;
}

type MembershipResponse = { membership: Membership };

/** Cambian cupos, estado del grupo y mi membresía: se refresca el grupo y sus listados. */
const refreshGroup = (groupId: string) => [
  { type: 'Group' as const, id: groupId },
  { type: 'Group' as const, id: 'LIST' },
  { type: 'Membership' as const, id: groupId },
];

export const membershipsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMembers: build.query<{ data: Member[] }, string>({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: (_r, _e, groupId) => [{ type: 'Membership', id: groupId }],
    }),
    joinGroup: build.mutation<MembershipResponse, string>({
      query: (groupId) => ({ url: `/groups/${groupId}/join`, method: 'POST' }),
      invalidatesTags: (_r, _e, groupId) => refreshGroup(groupId),
    }),
    approveMembership: build.mutation<MembershipResponse, { id: string; groupId: string; firstAmount?: number }>({
      query: ({ id, firstAmount }) => ({ url: `/memberships/${id}/approve`, method: 'PATCH', body: { firstAmount } }),
      invalidatesTags: (_r, _e, { groupId }) => refreshGroup(groupId),
    }),
    rejectMembership: build.mutation<MembershipResponse, { id: string; groupId: string }>({
      query: ({ id }) => ({ url: `/memberships/${id}/reject`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, { groupId }) => refreshGroup(groupId),
    }),
    confirmAccess: build.mutation<MembershipResponse, { id: string; groupId: string }>({
      query: ({ id }) => ({ url: `/memberships/${id}/confirm-access`, method: 'POST' }),
      invalidatesTags: (_r, _e, { groupId }) => [...refreshGroup(groupId), { type: 'Payment', id: 'LIST' }],
    }),
    leaveMembership: build.mutation<MembershipResponse, { id: string; groupId: string }>({
      query: ({ id }) => ({ url: `/memberships/${id}/leave`, method: 'POST' }),
      invalidatesTags: (_r, _e, { groupId }) => [...refreshGroup(groupId), { type: 'Payment', id: 'LIST' }],
    }),
    removeMember: build.mutation<MembershipResponse, { id: string; groupId: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/memberships/${id}/remove`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { groupId }) => [...refreshGroup(groupId), { type: 'Payment', id: 'LIST' }],
    }),
  }),
});

export const {
  useListMembersQuery,
  useJoinGroupMutation,
  useApproveMembershipMutation,
  useRejectMembershipMutation,
  useConfirmAccessMutation,
  useLeaveMembershipMutation,
  useRemoveMemberMutation,
} = membershipsApi;
