import type { Group, Membership, MembershipStatus, PaymentStatus, User } from '../../generated/prisma/client';
import { prisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/services/auth';

let counter = 0;
const next = () => `${Date.now()}-${++counter}`;

export const TEST_PASSWORD = 'Password123!';
let testPasswordHash: Promise<string> | undefined;

export async function createService(data: Partial<Parameters<typeof prisma.service.create>[0]['data']> = {}) {
  return prisma.service.create({
    data: {
      name: `Servicio ${next()}`,
      planType: 'familiar',
      maxMembers: 6,
      allowsOutOfHome: false,
      lastReviewedAt: new Date(),
      ...data,
    },
  });
}

export async function createUser(data: Partial<User> = {}) {
  testPasswordHash ??= hashPassword(TEST_PASSWORD);
  return prisma.user.create({
    data: {
      email: `user-${next()}@example.com`,
      passwordHash: await testPasswordHash,
      name: 'Test User',
      ...data,
    },
  });
}

export async function createGroup(data: Partial<Group> = {}) {
  const ownerId = data.ownerId ?? (await createUser()).id;
  const serviceId = data.serviceId ?? (await prisma.service.findFirst())?.id ?? (await createService()).id;

  return prisma.group.create({
    data: {
      title: 'Test Group',
      pricePerMember: 8000,
      paymentDay: 15,
      slots: 4,
      payoutMethod: 'nequi',
      payoutDetail: '3001234567',
      ...data,
      ownerId,
      serviceId,
    },
  });
}

export async function createMembership(data: {
  groupId: string;
  userId: string;
  status?: MembershipStatus;
  firstAmount?: number;
}) {
  return prisma.membership.create({
    data: { groupId: data.groupId, userId: data.userId, status: data.status ?? 'PENDING', firstAmount: data.firstAmount },
  });
}

export async function createPayment(data: {
  membershipId: string;
  status?: PaymentStatus;
  dueDate?: Date;
  period?: string;
}) {
  return prisma.paymentCycle.create({
    data: {
      membershipId: data.membershipId,
      period: data.period ?? '2026-11',
      amount: 8000,
      dueDate: data.dueDate ?? new Date('2026-11-15'),
      status: data.status ?? 'PENDING',
    },
  });
}

export async function setupActiveMembership() {
  const owner = await createUser({ email: `owner-${next()}@example.com` });
  const member = await createUser({ email: `member-${next()}@example.com` });
  const group = await createGroup({ ownerId: owner.id });
  const membership: Membership = await createMembership({
    groupId: group.id,
    userId: member.id,
    status: 'ACTIVE',
  });
  return { owner, member, group, membership };
}

export async function setupPayment(paymentData?: { status?: PaymentStatus; dueDate?: Date }) {
  const ctx = await setupActiveMembership();
  const payment = await createPayment({ membershipId: ctx.membership.id, ...paymentData });
  return { ...ctx, payment };
}
