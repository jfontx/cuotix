import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

export function listServices() {
  return prisma.service.findMany({ orderBy: { name: 'asc' } });
}

export async function getService(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new AppError('general/not-found');
  return service;
}
