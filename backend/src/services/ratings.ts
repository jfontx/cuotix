import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { CreateRatingInput } from '../schemas/ratings';

/**
 * Elegibilidad (Fase 7): el administrador y un miembro del mismo grupo pueden calificarse entre sí
 * cuando el miembro ya tiene una cuota `CONFIRMED` o salió del grupo (`LEFT`).
 */
async function isEligible(groupId: string, fromId: string, toId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
  if (!group) throw new AppError('general/not-found');

  const memberId = group.ownerId === fromId ? toId : group.ownerId === toId ? fromId : null;
  if (!memberId) return false;

  const membership = await prisma.membership.findFirst({
    where: {
      groupId,
      userId: memberId,
      OR: [{ status: 'LEFT' }, { cycles: { some: { status: 'CONFIRMED' } } }],
    },
    select: { id: true },
  });
  return !!membership;
}

export async function createRating(fromId: string, input: CreateRatingInput) {
  if (fromId === input.toId) throw new AppError('rating/not-eligible');
  if (!(await isEligible(input.groupId, fromId, input.toId))) throw new AppError('rating/not-eligible');

  try {
    return await prisma.rating.create({
      data: { groupId: input.groupId, fromId, toId: input.toId, score: input.score, comment: input.comment },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') throw new AppError('rating/already-rated');
    throw err;
  }
}

export async function getUserRatings(userId: string, page = 1, limit = 20) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) throw new AppError('general/not-found');

  const [aggregate, rows] = await Promise.all([
    prisma.rating.aggregate({ where: { toId: userId }, _avg: { score: true }, _count: { _all: true } }),
    prisma.rating.findMany({
      where: { toId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
        group: { select: { id: true, title: true } },
        fromUser: { select: { id: true, name: true } },
      },
    }),
  ]);

  const average = aggregate._avg.score;
  return {
    user,
    average: average === null ? null : Math.round(average * 10) / 10,
    count: aggregate._count._all,
    data: rows.map(({ fromUser, ...rating }) => ({ ...rating, from: fromUser })),
    page,
    limit,
  };
}
