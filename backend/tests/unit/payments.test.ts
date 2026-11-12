import { prisma } from '../../src/lib/prisma';
import {
  confirmPayment,
  getPaymentDetail,
  listGroupPayments,
  listMyPayments,
  markAsPaid,
  rejectPayment,
} from '../../src/services/payments';
import { createUser, setupPayment } from '../helpers/factories';

const REASON = 'No encontré la transferencia con esa referencia';

describe('markAsPaid', () => {
  it('cambia PENDING → MARKED_PAID', async () => {
    const { member, payment } = await setupPayment();
    const updated = await markAsPaid(payment.id, member.id);
    expect(updated.status).toBe('MARKED_PAID');
  });

  it('permite OVERDUE → MARKED_PAID', async () => {
    const { member, payment } = await setupPayment({ status: 'OVERDUE' });
    expect((await markAsPaid(payment.id, member.id)).status).toBe('MARKED_PAID');
  });

  it('falla desde CONFIRMED', async () => {
    const { member, payment } = await setupPayment({ status: 'CONFIRMED' });
    await expect(markAsPaid(payment.id, member.id)).rejects.toMatchObject({ code: 'payment/already-confirmed' });
  });

  it('falla desde CANCELLED y MARKED_PAID', async () => {
    const a = await setupPayment({ status: 'CANCELLED' });
    await expect(markAsPaid(a.payment.id, a.member.id)).rejects.toMatchObject({ code: 'payment/invalid-transition' });
    const b = await setupPayment({ status: 'MARKED_PAID' });
    await expect(markAsPaid(b.payment.id, b.member.id)).rejects.toMatchObject({ code: 'payment/invalid-transition' });
  });

  it('guarda referencia y fecha, y notifica al owner', async () => {
    const { owner, member, payment } = await setupPayment();
    const now = new Date('2026-11-14T15:00:00Z');
    const updated = await markAsPaid(payment.id, member.id, { reference: '1234' }, now);
    expect(updated.reference).toBe('1234');
    expect(updated.markedPaidAt).toEqual(now);
    const notes = await prisma.notification.findMany({ where: { userId: owner.id } });
    expect(notes.map((n) => n.type)).toEqual(['PAYMENT_MARKED_PAID']);
  });

  it('solo el pagador puede marcar', async () => {
    const { owner, payment } = await setupPayment();
    await expect(markAsPaid(payment.id, owner.id)).rejects.toMatchObject({ code: 'general/forbidden' });
  });

  it('404 si la cuota no existe', async () => {
    const user = await createUser();
    await expect(markAsPaid('00000000-0000-4000-8000-000000000000', user.id)).rejects.toMatchObject({
      code: 'payment/not-found',
    });
  });
});

describe('confirmPayment', () => {
  it('cambia MARKED_PAID → CONFIRMED y notifica al miembro', async () => {
    const { owner, member, payment } = await setupPayment({ status: 'MARKED_PAID' });
    const now = new Date('2026-11-15T10:00:00Z');
    const updated = await confirmPayment(payment.id, owner.id, now);
    expect(updated.status).toBe('CONFIRMED');
    expect(updated.confirmedAt).toEqual(now);
    const notes = await prisma.notification.findMany({ where: { userId: member.id } });
    expect(notes.map((n) => n.type)).toEqual(['PAYMENT_CONFIRMED']);
  });

  it('falla desde PENDING', async () => {
    const { owner, payment } = await setupPayment();
    await expect(confirmPayment(payment.id, owner.id)).rejects.toMatchObject({ code: 'payment/invalid-transition' });
  });

  it('falla si ya estaba confirmada', async () => {
    const { owner, payment } = await setupPayment({ status: 'CONFIRMED' });
    await expect(confirmPayment(payment.id, owner.id)).rejects.toMatchObject({ code: 'payment/already-confirmed' });
  });

  it('solo el owner puede confirmar', async () => {
    const { member, payment } = await setupPayment({ status: 'MARKED_PAID' });
    await expect(confirmPayment(payment.id, member.id)).rejects.toMatchObject({ code: 'group/not-owner' });
  });
});

describe('rejectPayment', () => {
  it('cambia MARKED_PAID → PENDING y notifica al miembro', async () => {
    const { owner, member, payment } = await setupPayment({ status: 'MARKED_PAID' });
    const updated = await rejectPayment(payment.id, owner.id, { reason: REASON });
    expect(updated.status).toBe('PENDING');
    const notes = await prisma.notification.findMany({ where: { userId: member.id } });
    expect(notes.map((n) => n.type)).toEqual(['PAYMENT_REJECTED']);
  });

  it('guarda motivo y limpia markedPaidAt', async () => {
    const { owner, payment } = await setupPayment({ status: 'MARKED_PAID' });
    await prisma.paymentCycle.update({ where: { id: payment.id }, data: { markedPaidAt: new Date() } });
    const updated = await rejectPayment(payment.id, owner.id, { reason: REASON });
    expect(updated.markedPaidAt).toBeNull();
    expect(updated.rejectionReason).toBe(REASON);
  });

  it('falla desde PENDING', async () => {
    const { owner, payment } = await setupPayment();
    await expect(rejectPayment(payment.id, owner.id, { reason: REASON })).rejects.toMatchObject({
      code: 'payment/invalid-transition',
    });
  });

  it('el miembro puede volver a marcar y se limpia el motivo anterior', async () => {
    const { owner, member, payment } = await setupPayment({ status: 'MARKED_PAID' });
    await rejectPayment(payment.id, owner.id, { reason: REASON });
    const again = await markAsPaid(payment.id, member.id);
    expect(again.status).toBe('MARKED_PAID');
    expect(again.rejectionReason).toBeNull();
  });
});

describe('listados y detalle', () => {
  it('listMyPayments solo devuelve mis cuotas y filtra por estado', async () => {
    const a = await setupPayment();
    await setupPayment({ status: 'CONFIRMED' });
    const mine = await listMyPayments(a.member.id);
    expect(mine.map((p) => p.id)).toEqual([a.payment.id]);
    expect(await listMyPayments(a.member.id, { status: 'CONFIRMED' })).toHaveLength(0);
  });

  it('listGroupPayments exige ser owner', async () => {
    const { owner, member, group, payment } = await setupPayment();
    expect((await listGroupPayments(group.id, owner.id)).map((p) => p.id)).toEqual([payment.id]);
    await expect(listGroupPayments(group.id, member.id)).rejects.toMatchObject({ code: 'group/not-owner' });
  });

  it('getPaymentDetail incluye payoutDetail al pagador y al owner, y rechaza a terceros', async () => {
    const { owner, member, payment } = await setupPayment();
    expect((await getPaymentDetail(payment.id, member.id)).payoutDetail).toBe('3001234567');
    expect((await getPaymentDetail(payment.id, owner.id)).payoutDetail).toBe('3001234567');
    const stranger = await createUser();
    await expect(getPaymentDetail(payment.id, stranger.id)).rejects.toMatchObject({ code: 'general/forbidden' });
  });

  it('los listados no exponen payoutDetail', async () => {
    const { member } = await setupPayment();
    const [row] = await listMyPayments(member.id);
    expect(row).not.toHaveProperty('payoutDetail');
    expect(JSON.stringify(row)).not.toContain('3001234567');
  });
});
