import request from 'supertest';

import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';
import { createUser, setupActiveMembership } from '../helpers/factories';

const app = createApp();

describe('reports', () => {
  it('POST /reports crea un reporte', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const res = await request(app)
      .post('/reports')
      .set(authHeader(member))
      .send({ groupId: group.id, reportedId: owner.id, reason: 'No dio acceso', detail: 'Hace una semana' });
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({ status: 'OPEN', reporterId: member.id, reportedId: owner.id });
  });

  it('POST /reports exige motivo (400) y relación con el usuario (403)', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const stranger = await createUser();
    const noReason = await request(app)
      .post('/reports')
      .set(authHeader(member))
      .send({ groupId: group.id, reportedId: owner.id });
    expect(noReason.status).toBe(400);
    const unrelated = await request(app)
      .post('/reports')
      .set(authHeader(stranger))
      .send({ groupId: group.id, reportedId: owner.id, reason: 'Spam' });
    expect(unrelated.status).toBe(403);
  });

  it('GET /reports: solo admin (403 para los demás)', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const admin = await createUser({ role: 'ADMIN' });
    await request(app).post('/reports').set(authHeader(member)).send({ groupId: group.id, reportedId: owner.id, reason: 'Spam' });

    const denied = await request(app).get('/reports').set(authHeader(member));
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('general/forbidden');

    const ok = await request(app).get('/reports?status=OPEN').set(authHeader(admin));
    expect(ok.status).toBe(200);
    expect(ok.body.data).toHaveLength(1);
    expect((await request(app).get('/reports?status=X').set(authHeader(admin))).status).toBe(400);
  });

  it('PATCH /reports/:id actualiza el estado', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const admin = await createUser({ role: 'ADMIN' });
    const created = await request(app)
      .post('/reports')
      .set(authHeader(member))
      .send({ groupId: group.id, reportedId: owner.id, reason: 'Spam' });
    const id = created.body.report.id;

    expect((await request(app).patch(`/reports/${id}`).set(authHeader(member)).send({ status: 'REVIEWED' })).status).toBe(403);
    const ok = await request(app).patch(`/reports/${id}`).set(authHeader(admin)).send({ status: 'REVIEWED' });
    expect(ok.status).toBe(200);
    expect(ok.body.report.status).toBe('REVIEWED');
    expect((await request(app).patch(`/reports/${id}`).set(authHeader(admin)).send({ status: 'X' })).status).toBe(400);
    expect((await request(app).patch('/reports/nope').set(authHeader(admin)).send({ status: 'REVIEWED' })).status).toBe(404);
  });
});
