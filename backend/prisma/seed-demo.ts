import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';
import { currentPeriod, dueDateFor, shiftPeriod } from '../src/lib/dates';
import { hashPassword } from '../src/services/auth';
import { seedServices } from './seed';

export const DEMO_PASSWORD = 'Test1234!';

export const DEMO_USERS = [
  { key: 'owner', email: 'owner@example.com', name: 'Dueño de Grupo', phone: '3001112233', role: 'USER' },
  { key: 'member', email: 'member@example.com', name: 'Miembro Activo', phone: '3002223344', role: 'USER' },
  { key: 'member2', email: 'member2@example.com', name: 'Segundo Miembro', phone: '3003334455', role: 'USER' },
  { key: 'applicant', email: 'solicitante@example.com', name: 'Nuevo Solicitante', phone: null, role: 'USER' },
  { key: 'approved', email: 'aprobado@example.com', name: 'Miembro Aprobado', phone: null, role: 'USER' },
  { key: 'moderator', email: 'moderator@example.com', name: 'Moderador Cuotix', phone: null, role: 'ADMIN' },
] as const;

/** Borra todos los datos (no el esquema) en orden de dependencias. */
export async function clearDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.rating.deleteMany(),
    prisma.report.deleteMany(),
    prisma.paymentCycle.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.group.deleteMany(),
    prisma.service.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Datos de demostración. Las fechas son relativas a `now`, de modo que siempre hay
 * una cuota vigente, una del mes anterior y una atrasada, sin importar cuándo se ejecute.
 * Requiere el catálogo de servicios (`seedServices`).
 */
export async function seedDemo(prisma: PrismaClient, now = new Date()) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const u: Record<string, { id: string }> = {};
  for (const { key, ...data } of DEMO_USERS) {
    u[key] = await prisma.user.create({ data: { ...data, passwordHash } });
  }

  const service = async (name: string) => prisma.service.findUniqueOrThrow({ where: { name } });
  const spotify = await service('Spotify Premium Familiar');
  const netflix = await service('Netflix (Miembro Extra)');
  const youtube = await service('YouTube Premium Familiar');

  // Grupo 1: con cupos libres, miembros en distintos estados y una solicitud pendiente
  const g1 = await prisma.group.create({
    data: {
      ownerId: u.owner.id,
      serviceId: spotify.id,
      title: 'Spotify familiar - Chapinero',
      description: 'Plan familiar de Spotify, pago por Nequi los 15 de cada mes.',
      pricePerMember: 8000,
      paymentDay: 15,
      slots: 4,
      payoutMethod: 'Nequi',
      payoutDetail: '3001112233',
    },
  });
  // Grupo 2: lleno (único cupo ocupado)
  const g2 = await prisma.group.create({
    data: {
      ownerId: u.member.id,
      serviceId: netflix.id,
      title: 'Netflix miembro extra',
      pricePerMember: 12000,
      paymentDay: 5,
      slots: 1,
      status: 'FULL',
      payoutMethod: 'Bancolombia',
      payoutDetail: 'Ahorros 123-456789-00',
    },
  });
  // Grupo 3: abierto y sin miembros, para probar "unirse" desde Explorar
  await prisma.group.create({
    data: {
      ownerId: u.owner.id,
      serviceId: youtube.id,
      title: 'YouTube Premium familiar',
      description: 'Dos cupos libres, mismo hogar.',
      pricePerMember: 9000,
      paymentDay: 20,
      slots: 2,
      payoutMethod: 'Nequi',
      payoutDetail: '3001112233',
    },
  });

  const joinedAt = new Date(now.getTime() - 40 * 86_400_000);
  const membership = (groupId: string, userId: string, status: 'PENDING' | 'APPROVED' | 'ACTIVE', extra = {}) =>
    prisma.membership.create({
      data: { groupId, userId, status, joinedAt: status === 'ACTIVE' ? joinedAt : null, ...extra },
    });

  const mMember = await membership(g1.id, u.member.id, 'ACTIVE');
  const mMember2 = await membership(g1.id, u.member2.id, 'ACTIVE');
  await membership(g1.id, u.applicant.id, 'PENDING');
  await membership(g1.id, u.approved.id, 'APPROVED', { firstAmount: 5000 });
  const mOwnerInG2 = await membership(g2.id, u.owner.id, 'ACTIVE');

  const current = currentPeriod(now);
  const previous = shiftPeriod(current, -1);
  const cycle = (
    membershipId: string,
    period: string,
    paymentDay: number,
    amount: number,
    status: 'PENDING' | 'MARKED_PAID' | 'CONFIRMED' | 'OVERDUE',
    extra: Record<string, unknown> = {},
  ) =>
    prisma.paymentCycle.create({
      data: { membershipId, period, amount, dueDate: dueDateFor(period, paymentDay), status, ...extra },
    });

  // Historial: un miembro al día, otro con atraso y una cuota esperando confirmación
  await cycle(mMember.id, previous, 15, 8000, 'CONFIRMED', { reference: 'NEQ-1001', markedPaidAt: joinedAt, confirmedAt: joinedAt });
  await cycle(mMember.id, current, 15, 8000, 'MARKED_PAID', { reference: 'NEQ-1002', markedPaidAt: now });
  await cycle(mMember2.id, previous, 15, 8000, 'OVERDUE', { overdueAt: now });
  await cycle(mMember2.id, current, 15, 8000, 'PENDING');
  await cycle(mOwnerInG2.id, previous, 5, 12000, 'CONFIRMED', { markedPaidAt: joinedAt, confirmedAt: joinedAt });
  await cycle(mOwnerInG2.id, current, 5, 12000, 'PENDING');

  await prisma.rating.createMany({
    data: [
      { groupId: g1.id, fromId: u.member.id, toId: u.owner.id, score: 5, comment: 'Siempre responde rápido' },
      { groupId: g1.id, fromId: u.member2.id, toId: u.owner.id, score: 4 },
      { groupId: g1.id, fromId: u.owner.id, toId: u.member.id, score: 5, comment: 'Paga puntual' },
    ],
  });
  await prisma.report.create({
    data: { groupId: g1.id, reporterId: u.owner.id, reportedId: u.member2.id, reason: 'Pagos atrasados', detail: 'Debe la cuota del mes pasado.' },
  });

  await prisma.notification.createMany({
    data: [
      { userId: u.owner.id, type: 'JOIN_REQUEST', title: 'Nueva solicitud', body: 'Nuevo Solicitante quiere unirse a Spotify familiar - Chapinero', data: { groupId: g1.id } },
      { userId: u.member2.id, type: 'PAYMENT_OVERDUE', title: 'Cuota atrasada', body: 'Tu cuota de Spotify familiar - Chapinero está vencida', data: { groupId: g1.id } },
      { userId: u.approved.id, type: 'MEMBERSHIP_APPROVED', title: 'Solicitud aprobada', body: 'Ya puedes confirmar tu acceso a Spotify familiar - Chapinero', data: { groupId: g1.id } },
    ],
  });
}

/** Deja la BD en el estado inicial de la demo: catálogo + datos de ejemplo. */
export async function resetDemo(prisma: PrismaClient, now = new Date()) {
  await clearDatabase(prisma);
  await seedServices(prisma);
  await seedDemo(prisma, now);
}

if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.error('El reset de demo está deshabilitado en producción');
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  resetDemo(prisma)
    .then(() => console.log(`BD de demo lista. Usuarios: ${DEMO_USERS.map((x) => x.email).join(', ')} (contraseña ${DEMO_PASSWORD})`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
