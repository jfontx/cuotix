import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers/auth';
import { createUser } from '../helpers/factories';

const app = createApp();
const NIL = '00000000-0000-4000-8000-000000000000';

async function seed(userId: string, count: number) {
  const base = Date.now();
  for (let i = 0; i < count; i++) {
    await prisma.notification.create({
      data: { userId, type: 'JOIN_REQUEST', title: `N${i}`, body: 'b', sentAt: new Date(base + i * 1000) },
    });
  }
}

describe('POST /me/push-token', () => {
  it('registra token', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/me/push-token')
      .set(authHeader(user))
      .send({ token: 'ExponentPushToken[abc]', platform: 'ios' });
    expect(res.status).toBe(204);
    expect(await prisma.pushToken.findMany({ where: { userId: user.id } })).toHaveLength(1);
  });

  it('reasigna si ya existe', async () => {
    const a = await createUser();
    const b = await createUser();
    const body = { token: 'ExponentPushToken[abc]', platform: 'android' };
    await request(app).post('/me/push-token').set(authHeader(a)).send(body);
    await request(app).post('/me/push-token').set(authHeader(b)).send(body);
    const tokens = await prisma.pushToken.findMany();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].userId).toBe(b.id);
  });

  it('valida el cuerpo y exige sesión', async () => {
    const user = await createUser();
    expect((await request(app).post('/me/push-token').set(authHeader(user)).send({ token: '' })).status).toBe(400);
    expect((await request(app).post('/me/push-token').send({ token: 't', platform: 'ios' })).status).toBe(401);
  });
});

describe('GET /me/notifications', () => {
  it('lista paginada, más recientes primero, solo las propias', async () => {
    const user = await createUser();
    const other = await createUser();
    await seed(user.id, 3);
    await seed(other.id, 2);
    const res = await request(app).get('/me/notifications?limit=2').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 2, total: 3, unread: 3 });
    expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['N2', 'N1']);
    const page2 = await request(app).get('/me/notifications?limit=2&page=2').set(authHeader(user));
    expect(page2.body.data.map((n: { title: string }) => n.title)).toEqual(['N0']);
  });

  it('valida la paginación', async () => {
    const user = await createUser();
    expect((await request(app).get('/me/notifications?page=0').set(authHeader(user))).status).toBe(400);
  });
});

describe('PATCH /notifications/:id/read', () => {
  it('marca leída', async () => {
    const user = await createUser();
    await seed(user.id, 1);
    const n = await prisma.notification.findFirstOrThrow();
    const res = await request(app).patch(`/notifications/${n.id}/read`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);
  });

  it('404 si es de otro usuario, no existe o no es UUID', async () => {
    const user = await createUser();
    const other = await createUser();
    await seed(other.id, 1);
    const n = await prisma.notification.findFirstOrThrow();
    expect((await request(app).patch(`/notifications/${n.id}/read`).set(authHeader(user))).status).toBe(404);
    expect((await request(app).patch(`/notifications/${NIL}/read`).set(authHeader(user))).status).toBe(404);
    expect((await request(app).patch('/notifications/abc/read').set(authHeader(user))).status).toBe(404);
    expect((await prisma.notification.findUniqueOrThrow({ where: { id: n.id } })).read).toBe(false);
  });
});

describe('POST /me/notifications/read-all', () => {
  it('marca todas las propias', async () => {
    const user = await createUser();
    const other = await createUser();
    await seed(user.id, 3);
    await seed(other.id, 1);
    const res = await request(app).post('/me/notifications/read-all').set(authHeader(user));
    expect(res.body).toEqual({ updated: 3 });
    expect(await prisma.notification.count({ where: { userId: user.id, read: false } })).toBe(0);
    expect(await prisma.notification.count({ where: { userId: other.id, read: false } })).toBe(1);
  });
});
