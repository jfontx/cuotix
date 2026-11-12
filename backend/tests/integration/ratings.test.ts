import request from 'supertest';

import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';
import { createPayment, createUser, setupActiveMembership } from '../helpers/factories';

const app = createApp();

async function eligible() {
  const ctx = await setupActiveMembership();
  await createPayment({ membershipId: ctx.membership.id, status: 'CONFIRMED' });
  return ctx;
}

describe('POST /ratings', () => {
  it('crea una calificación', async () => {
    const { owner, member, group } = await eligible();
    const res = await request(app)
      .post('/ratings')
      .set(authHeader(member))
      .send({ groupId: group.id, toId: owner.id, score: 5, comment: 'Muy puntual' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toMatchObject({ score: 5, fromId: member.id, toId: owner.id, comment: 'Muy puntual' });
  });

  it('403 si no es elegible', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const res = await request(app)
      .post('/ratings')
      .set(authHeader(member))
      .send({ groupId: group.id, toId: owner.id, score: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('rating/not-eligible');
  });

  it('409 si ya calificó', async () => {
    const { owner, member, group } = await eligible();
    const body = { groupId: group.id, toId: owner.id, score: 4 };
    await request(app).post('/ratings').set(authHeader(member)).send(body);
    const res = await request(app).post('/ratings').set(authHeader(member)).send(body);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('rating/already-rated');
  });

  it('400 con puntaje fuera de 1-5 y 401 sin token', async () => {
    const { owner, member, group } = await eligible();
    for (const score of [0, 6, 3.5]) {
      const res = await request(app)
        .post('/ratings')
        .set(authHeader(member))
        .send({ groupId: group.id, toId: owner.id, score });
      expect(res.status).toBe(400);
    }
    expect((await request(app).post('/ratings').send({})).status).toBe(401);
  });
});

describe('GET /users/:id/ratings', () => {
  it('retorna promedio y lista', async () => {
    const { owner, member, group } = await eligible();
    await request(app).post('/ratings').set(authHeader(member)).send({ groupId: group.id, toId: owner.id, score: 4 });

    const res = await request(app).get(`/users/${owner.id}/ratings`).set(authHeader(member));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ average: 4, count: 1, user: { id: owner.id }, page: 1, limit: 20 });
    expect(res.body.data[0]).toMatchObject({ score: 4, from: { id: member.id }, group: { id: group.id } });
  });

  it('404 con id inválido o inexistente', async () => {
    const user = await createUser();
    expect((await request(app).get('/users/abc/ratings').set(authHeader(user))).status).toBe(404);
    expect(
      (await request(app).get('/users/00000000-0000-4000-8000-000000000000/ratings').set(authHeader(user))).status,
    ).toBe(404);
  });
});
