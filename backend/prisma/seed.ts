import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

export const SERVICES = [
  {
    name: 'Spotify Premium Familiar',
    planType: 'familiar',
    maxMembers: 6,
    allowsOutOfHome: false,
    notes: 'Todos deben residir en la misma dirección. Spotify puede verificar ubicación.',
  },
  {
    name: 'YouTube Premium Familiar',
    planType: 'familiar',
    maxMembers: 6,
    allowsOutOfHome: false,
    notes: 'Miembros deben ser del mismo hogar. Google puede verificar.',
  },
  {
    name: 'Netflix (Miembro Extra)',
    planType: 'miembro_extra',
    maxMembers: 2,
    allowsOutOfHome: true,
    notes: 'El miembro extra puede estar en otra ubicación.',
  },
];

/** Idempotente: actualiza por nombre, por lo que se puede ejecutar varias veces. */
export async function seedServices(prisma: PrismaClient) {
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: { ...service, lastReviewedAt: new Date() },
      create: { ...service, lastReviewedAt: new Date() },
    });
  }
}

if (require.main === module) {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  seedServices(prisma)
    .then(() => console.log(`Catálogo de servicios cargado (${SERVICES.length})`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
