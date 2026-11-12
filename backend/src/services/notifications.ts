import type { NotificationType, Prisma } from '../../generated/prisma/client';
import { prisma } from '../lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

/** Notificación dentro de la app. El envío push llega con la Fase 5. */
export async function notify(
  db: Db,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Prisma.InputJsonValue,
) {
  await db.notification.create({ data: { userId, type, title, body, data } });
}
