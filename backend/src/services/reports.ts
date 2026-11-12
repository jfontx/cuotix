import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { CreateReportInput, ListReportsQuery, UpdateReportInput } from '../schemas/reports';

const LIST_LIMIT = 200;
const RELATED_STATUSES = ['APPROVED', 'ACTIVE', 'LEFT', 'REMOVED'] as const;

const reportInclude = {
  group: { select: { id: true, title: true } },
  reporter: { select: { id: true, name: true } },
  reported: { select: { id: true, name: true } },
} as const;

async function assertAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') throw new AppError('general/forbidden');
}

/** Quien reporta y quien es reportado deben haber compartido el grupo (administrador o miembro). */
async function sharedGroup(groupId: string, a: string, b: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true, memberships: { where: { status: { in: [...RELATED_STATUSES] } }, select: { userId: true } } },
  });
  if (!group) throw new AppError('general/not-found');
  const people = new Set([group.ownerId, ...group.memberships.map((m) => m.userId)]);
  return people.has(a) && people.has(b);
}

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (reporterId === input.reportedId) throw new AppError('general/forbidden');
  if (!(await sharedGroup(input.groupId, reporterId, input.reportedId))) throw new AppError('general/forbidden');
  return prisma.report.create({
    data: {
      groupId: input.groupId,
      reporterId,
      reportedId: input.reportedId,
      reason: input.reason,
      detail: input.detail,
    },
  });
}

export async function getReports(adminId: string, q: ListReportsQuery = {}) {
  await assertAdmin(adminId);
  return prisma.report.findMany({
    where: q.status ? { status: q.status } : {},
    include: reportInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  });
}

export async function updateReport(adminId: string, id: string, input: UpdateReportInput) {
  await assertAdmin(adminId);
  try {
    return await prisma.report.update({ where: { id }, data: { status: input.status }, include: reportInclude });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') throw new AppError('general/not-found');
    throw err;
  }
}
