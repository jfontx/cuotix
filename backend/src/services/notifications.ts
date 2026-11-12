import type { Notification, NotificationType, Prisma } from '../../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Resultado por mensaje, en el mismo orden. `invalidToken` = el token ya no existe y debe borrarse. */
export type PushResult = { ok: true } | { ok: false; invalidToken: boolean };
export type PushSender = (messages: PushMessage[]) => Promise<PushResult[]>;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const expoSender: PushSender = async (messages) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  const res = await fetch(EXPO_PUSH_URL, { method: 'POST', headers, body: JSON.stringify(messages) });
  if (!res.ok) throw new Error(`Expo push respondió ${res.status}`);
  const { data } = (await res.json()) as { data: { status: string; details?: { error?: string } }[] };
  return data.map((t) =>
    t.status === 'ok' ? { ok: true } : { ok: false, invalidToken: t.details?.error === 'DeviceNotRegistered' },
  );
};

// En tests no se sale a la red; cada test puede inyectar su propio sender.
let sender: PushSender = process.env.NODE_ENV === 'test' ? async (m) => m.map(() => ({ ok: true })) : expoSender;

export function setPushSender(next: PushSender | null) {
  sender = next ?? expoSender;
}

/** Envía el push a todos los dispositivos del usuario. Nunca lanza: un fallo de push no debe romper el flujo. */
export async function sendPush(userId: string, title: string, body: string, data?: Prisma.InputJsonValue) {
  try {
    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const payload = typeof data === 'object' && data !== null && !Array.isArray(data) ? { ...data } : undefined;
    const results = await sender(tokens.map((t) => ({ to: t.token, title, body, data: payload })));

    const invalid = tokens.filter((_, i) => {
      const r = results[i];
      return r && !r.ok && r.invalidToken;
    });
    if (invalid.length > 0) await prisma.pushToken.deleteMany({ where: { id: { in: invalid.map((t) => t.id) } } });
  } catch (err) {
    console.error('No se pudo enviar el push', err);
  }
}

interface NotifyOptions {
  /** Cuota asociada: junto con `userId` y `type` evita duplicados (`@@unique`). */
  paymentId?: string;
}

/**
 * Guarda la notificación dentro de la app y dispara el push sin esperarlo
 * (puede llamarse dentro de una transacción; el push no debe retener la conexión).
 */
export async function notify(
  db: Db,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Prisma.InputJsonValue,
  opts: NotifyOptions = {},
) {
  const notification = await db.notification.create({
    data: { userId, type, title, body, data, paymentId: opts.paymentId },
  });
  void sendPush(userId, title, body, { ...(data as object | undefined), type, notificationId: notification.id });
  return notification;
}

/**
 * Variante idempotente para los jobs: si ya existe la notificación (mismo usuario, tipo y cuota)
 * no hace nada y devuelve `false`. Espera el push para que el lote sea determinista.
 */
export async function notifyOnce(
  userId: string,
  type: NotificationType,
  paymentId: string,
  title: string,
  body: string,
  data?: Prisma.InputJsonValue,
) {
  let notification: Notification;
  try {
    notification = await prisma.notification.create({ data: { userId, type, title, body, data, paymentId } });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return false;
    throw err;
  }
  await sendPush(userId, title, body, { ...(data as object | undefined), type, notificationId: notification.id });
  return true;
}

export async function registerPushToken(userId: string, token: string, platform: string) {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform },
  });
}

const PAGE_SIZE = 20;

export async function listNotifications(userId: string, page = 1, limit = PAGE_SIZE) {
  const where = { userId };
  const [data, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ sentAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { data, page, limit, total, unread };
}

export async function markNotificationRead(id: string, userId: string) {
  // Un id ajeno o inexistente es indistinguible: 404 en ambos casos
  const { count } = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  if (count === 0) throw new AppError('general/not-found');
  return prisma.notification.findUniqueOrThrow({ where: { id } });
}

export async function markAllNotificationsRead(userId: string) {
  const { count } = await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { updated: count };
}
