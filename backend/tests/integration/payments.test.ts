import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers/auth';
import { createUser, setupPayment } from '../helpers/factories';

const app = createApp();
const REASON = 'No encontré la transferencia con esa referencia';
const NIL = '00000000-0000-4000-8000-000000000000';

describe('GET /me/payments', () => {
  it('retorna solo mis cuotas', async () => {
    const mine = await setupPayment();
    await setupPayment();
    const res = await request(app).get('/me/payments').set(authHeader(mine.member));
    expect(res.status).toBe(200);
    expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([mine.payment.id]);
    expect(res.body.data[0]).toMatchObject({ status: 'PENDING', group: { title: 'Test Group' } });
    expect(res.body.data[0]).not.toHaveProperty('payoutDetail');
  });

  it('filtra por estado y valida el filtro', async () => {
    const ctx = await setupPayment({ status: 'OVERDUE' });
    const ok = await request(app).get('/me/payments?status=OVERDUE').set(authHeader(ctx.member));
    expect(ok.body.data).toHaveLength(1);
    const empty = await request(app).get('/me/payments?status=CONFIRMED').set(authHeader(ctx.member));
    expect(empty.body.data).toHaveLength(0);
    expect((await request(app).get('/me/payments?status=X').set(authHeader(ctx.member))).status).toBe(400);
  });

  it('401 sin token', async () => {
    expect((await request(app).get('/me/payments')).status).toBe(401);
  });
});

describe('GET /groups/:id/payments', () => {
  it('solo owner ve todas', async () => {
    const { owner, member, group, payment } = await setupPayment();
    const ok = await request(app).get(`/groups/${group.id}/payments`).set(authHeader(owner));
    expect(ok.status).toBe(200);
    expect(ok.body.data.map((p: { id: string }) => p.id)).toEqual([payment.id]);
    expect(ok.body.data[0].member.id).toBe(member.id);

    const denied = await request(app).get(`/groups/${group.id}/payments`).set(authHeader(member));
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('group/not-owner');
  });

  it('404 si el grupo no existe', async () => {
    const user = await createUser();
    expect((await request(app).get(`/groups/${NIL}/payments`).set(authHeader(user))).status).toBe(404);
  });
});

describe('GET /payments/:id', () => {
  it('el pagador y el owner ven el detalle con datos de pago; un tercero no', async () => {
    const { owner, member, payment } = await setupPayment();
    for (const user of [member, owner]) {
      const res = await request(app).get(`/payments/${payment.id}`).set(authHeader(user));
      expect(res.status).toBe(200);
      expect(res.body.payment).toMatchObject({ id: payment.id, payoutDetail: '3001234567' });
    }
    const stranger = await createUser();
    expect((await request(app).get(`/payments/${payment.id}`).set(authHeader(stranger))).status).toBe(403);
  });

  it('404 con id inexistente o no UUID', async () => {
    const user = await createUser();
    expect((await request(app).get(`/payments/${NIL}`).set(authHeader(user))).status).toBe(404);
    expect((await request(app).get('/payments/abc').set(authHeader(user))).status).toBe(404);
  });
});

describe('POST /payments/:id/mark-paid', () => {
  it('cambia estado y guarda la referencia', async () => {
    const { member, payment } = await setupPayment();
    const res = await request(app)
      .post(`/payments/${payment.id}/mark-paid`)
      .set(authHeader(member))
      .send({ reference: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.payment).toMatchObject({ status: 'MARKED_PAID', reference: '1234' });
    expect(res.body.payment.markedPaidAt).toBeTruthy();
  });

  it('permite desde OVERDUE', async () => {
    const { member, payment } = await setupPayment({ status: 'OVERDUE' });
    const res = await request(app).post(`/payments/${payment.id}/mark-paid`).set(authHeader(member)).send({});
    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('MARKED_PAID');
  });

  it('409 desde CONFIRMED y 403 si no es el pagador', async () => {
    const done = await setupPayment({ status: 'CONFIRMED' });
    const conflict = await request(app).post(`/payments/${done.payment.id}/mark-paid`).set(authHeader(done.member)).send({});
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('payment/already-confirmed');

    const other = await setupPayment();
    expect((await request(app).post(`/payments/${other.payment.id}/mark-paid`).set(authHeader(other.owner)).send({})).status).toBe(403);
  });

  it('dos peticiones simultáneas solo se aplican una vez', async () => {
    const { member, owner, payment } = await setupPayment();
    const results = await Promise.all([
      request(app).post(`/payments/${payment.id}/mark-paid`).set(authHeader(member)).send({}),
      request(app).post(`/payments/${payment.id}/mark-paid`).set(authHeader(member)).send({}),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.notification.count({ where: { userId: owner.id } })).toBe(1);
  });
});

describe('POST /payments/:id/confirm', () => {
  it('el owner confirma', async () => {
    const { owner, payment } = await setupPayment({ status: 'MARKED_PAID' });
    const res = await request(app).post(`/payments/${payment.id}/confirm`).set(authHeader(owner));
    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('CONFIRMED');
    expect(res.body.payment.confirmedAt).toBeTruthy();
  });

  it('solo owner (403)', async () => {
    const { member, payment } = await setupPayment({ status: 'MARKED_PAID' });
    const res = await request(app).post(`/payments/${payment.id}/confirm`).set(authHeader(member));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('group/not-owner');
  });

  it('transición inválida (409)', async () => {
    const { owner, payment } = await setupPayment();
    const res = await request(app).post(`/payments/${payment.id}/confirm`).set(authHeader(owner));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('payment/invalid-transition');
  });
});

describe('POST /payments/:id/reject', () => {
  it('requiere motivo (400)', async () => {
    const { owner, payment } = await setupPayment({ status: 'MARKED_PAID' });
    for (const body of [{}, { reason: 'corto' }]) {
      const res = await request(app).post(`/payments/${payment.id}/reject`).set(authHeader(owner)).send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('validation/error');
    }
  });

  it('limpia markedPaidAt y guarda el motivo', async () => {
    const { owner, payment } = await setupPayment({ status: 'MARKED_PAID' });
    await prisma.paymentCycle.update({ where: { id: payment.id }, data: { markedPaidAt: new Date() } });
    const res = await request(app).post(`/payments/${payment.id}/reject`).set(authHeader(owner)).send({ reason: REASON });
    expect(res.status).toBe(200);
    const updated = await prisma.paymentCycle.findUnique({ where: { id: payment.id } });
    expect(updated).toMatchObject({ status: 'PENDING', markedPaidAt: null, rejectionReason: REASON });
  });

  it('403 para el miembro y 409 desde PENDING', async () => {
    const a = await setupPayment({ status: 'MARKED_PAID' });
    expect((await request(app).post(`/payments/${a.payment.id}/reject`).set(authHeader(a.member)).send({ reason: REASON })).status).toBe(403);
    const b = await setupPayment();
    expect((await request(app).post(`/payments/${b.payment.id}/reject`).set(authHeader(b.owner)).send({ reason: REASON })).status).toBe(409);
  });
});
