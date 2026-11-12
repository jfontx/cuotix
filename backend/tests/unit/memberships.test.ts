import { dueDateFor, firstPeriod, nextCycleEnd } from '../../src/lib/dates';
import { prisma } from '../../src/lib/prisma';
import {
  approveMembership,
  confirmAccess,
  joinGroup,
  leaveMembership,
  rejectMembership,
  removeMember,
} from '../../src/services/memberships';
import { createGroup, createMembership, createPayment, createUser } from '../helpers/factories';

async function setup(groupData: Parameters<typeof createGroup>[0] = {}) {
  const owner = await createUser();
  const member = await createUser();
  const group = await createGroup({ ownerId: owner.id, ...groupData });
  return { owner, member, group };
}

describe('joinGroup', () => {
  it('crea membresía PENDING y notifica al owner', async () => {
    const { owner, member, group } = await setup();
    const membership = await joinGroup(group.id, member.id);
    expect(membership.status).toBe('PENDING');
    const notes = await prisma.notification.findMany({ where: { userId: owner.id } });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('JOIN_REQUEST');
  });

  it('falla si ya es miembro', async () => {
    const { member, group } = await setup();
    await joinGroup(group.id, member.id);
    await expect(joinGroup(group.id, member.id)).rejects.toMatchObject({ code: 'group/already-member' });
  });

  it('falla si grupo FULL', async () => {
    const { member, group } = await setup({ status: 'FULL' });
    await expect(joinGroup(group.id, member.id)).rejects.toMatchObject({ code: 'group/full' });
  });

  it('falla si el grupo está pausado o cerrado', async () => {
    const { member, group } = await setup({ status: 'PAUSED' });
    await expect(joinGroup(group.id, member.id)).rejects.toMatchObject({ code: 'group/closed' });
  });

  it('el owner no puede unirse a su grupo', async () => {
    const { owner, group } = await setup();
    await expect(joinGroup(group.id, owner.id)).rejects.toMatchObject({ code: 'general/forbidden' });
  });

  it('permite volver a solicitar tras un rechazo', async () => {
    const { member, group } = await setup();
    await createMembership({ groupId: group.id, userId: member.id, status: 'REJECTED' });
    const membership = await joinGroup(group.id, member.id);
    expect(membership.status).toBe('PENDING');
  });
});

describe('approveMembership', () => {
  it('valida cupos en transacción', async () => {
    const { owner, group } = await setup({ slots: 1 });
    const a = await createMembership({ groupId: group.id, userId: (await createUser()).id });
    const b = await createMembership({ groupId: group.id, userId: (await createUser()).id });
    await approveMembership(a.id, owner.id, {});
    await expect(approveMembership(b.id, owner.id, {})).rejects.toMatchObject({ code: 'group/slots-exceeded' });
  });

  it('guarda firstAmount y marca el grupo FULL al llenarlo', async () => {
    const { owner, group } = await setup({ slots: 1 });
    const m = await createMembership({ groupId: group.id, userId: (await createUser()).id });
    const approved = await approveMembership(m.id, owner.id, { firstAmount: 5000 });
    expect(approved).toMatchObject({ status: 'APPROVED', firstAmount: 5000 });
    expect((await prisma.group.findUniqueOrThrow({ where: { id: group.id } })).status).toBe('FULL');
  });

  it('solo aprueba solicitudes PENDING y solo el owner', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await expect(approveMembership(m.id, owner.id, {})).rejects.toMatchObject({ code: 'membership/invalid-transition' });
    await expect(approveMembership(m.id, member.id, {})).rejects.toMatchObject({ code: 'group/not-owner' });
  });
});

describe('rejectMembership', () => {
  it('cambia a REJECTED y notifica al miembro', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    expect((await rejectMembership(m.id, owner.id)).status).toBe('REJECTED');
    expect(await prisma.notification.count({ where: { userId: member.id, type: 'MEMBERSHIP_REJECTED' } })).toBe(1);
  });
});

describe('confirmAccess', () => {
  const now = new Date('2026-11-10T15:00:00Z'); // 10 de noviembre en Bogotá

  it('cambia a ACTIVE y crea la primera cuota con firstAmount', async () => {
    const { member, group } = await setup({ paymentDay: 15 });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED', firstAmount: 5000 });
    const active = await confirmAccess(m.id, member.id, now);
    expect(active.status).toBe('ACTIVE');
    expect(active.joinedAt).toEqual(now);
    const cycles = await prisma.paymentCycle.findMany({ where: { membershipId: m.id } });
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toMatchObject({ amount: 5000, period: '2026-11', status: 'PENDING' });
    expect(cycles[0].dueDate).toEqual(new Date('2026-11-15T05:00:00Z'));
  });

  it('usa el precio del grupo y el mes siguiente si el día de pago ya pasó', async () => {
    const { member, group } = await setup({ paymentDay: 5, pricePerMember: 9000 });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    await confirmAccess(m.id, member.id, now);
    const cycle = await prisma.paymentCycle.findFirstOrThrow({ where: { membershipId: m.id } });
    expect(cycle).toMatchObject({ amount: 9000, period: '2026-12' });
  });

  it('falla si no está APPROVED', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    await expect(confirmAccess(m.id, member.id)).rejects.toMatchObject({ code: 'membership/invalid-transition' });
  });

  it('solo el dueño de la membresía puede confirmar', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    await expect(confirmAccess(m.id, owner.id)).rejects.toMatchObject({ code: 'general/forbidden' });
  });

  it('notifica al administrador', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    await confirmAccess(m.id, member.id);
    expect(await prisma.notification.count({ where: { userId: owner.id, type: 'ACCESS_CONFIRMED' } })).toBe(1);
  });
});

describe('leaveMembership', () => {
  const now = new Date('2026-11-10T15:00:00Z');

  it('establece leavesAt, cancela las cuotas que vencen desde esa fecha y reabre el grupo', async () => {
    const { member, group } = await setup({ paymentDay: 15, status: 'FULL' });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const current = await createPayment({ membershipId: m.id, period: '2026-11', dueDate: dueDateFor('2026-11', 15) });
    const future = await createPayment({ membershipId: m.id, period: '2026-12', dueDate: dueDateFor('2026-12', 15) });

    const left = await leaveMembership(m.id, member.id, now);
    expect(left.status).toBe('LEFT');
    expect(left.leavesAt).toEqual(dueDateFor('2026-11', 15));
    // Se cancela todo lo que vence en leavesAt o después (aquí, la cuota del 15 de noviembre)
    expect((await prisma.paymentCycle.findUniqueOrThrow({ where: { id: future.id } })).status).toBe('CANCELLED');
    expect((await prisma.paymentCycle.findUniqueOrThrow({ where: { id: current.id } })).status).toBe('CANCELLED');
    expect((await prisma.group.findUniqueOrThrow({ where: { id: group.id } })).status).toBe('OPEN');
  });

  it('conserva las cuotas con vencimiento anterior al fin del ciclo', async () => {
    const { member, group } = await setup({ paymentDay: 15 });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const paid = await createPayment({ membershipId: m.id, period: '2026-10', dueDate: dueDateFor('2026-10', 15), status: 'CONFIRMED' });
    const pending = await createPayment({ membershipId: m.id, period: '2026-11', dueDate: dueDateFor('2026-11', 15) });
    await leaveMembership(m.id, member.id, new Date('2026-11-20T15:00:00Z'));
    expect((await prisma.paymentCycle.findUniqueOrThrow({ where: { id: paid.id } })).status).toBe('CONFIRMED');
    // leavesAt = 15 de diciembre: la cuota de noviembre es del ciclo vigente
    expect((await prisma.paymentCycle.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe('PENDING');
  });

  it('falla si la membresía no está APPROVED/ACTIVE', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    await expect(leaveMembership(m.id, member.id)).rejects.toMatchObject({ code: 'membership/invalid-transition' });
  });
});

describe('removeMember', () => {
  it('falla si hay menos de 2 cuotas OVERDUE', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: m.id, period: '2026-10', status: 'OVERDUE', dueDate: dueDateFor('2026-10', 15) });
    await expect(removeMember(m.id, owner.id)).rejects.toMatchObject({ code: 'membership/not-eligible-removal' });
  });

  it('falla si las cuotas vencidas no son consecutivas', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: m.id, period: '2026-09', status: 'OVERDUE', dueDate: dueDateFor('2026-09', 15) });
    await createPayment({ membershipId: m.id, period: '2026-10', status: 'CONFIRMED', dueDate: dueDateFor('2026-10', 15) });
    await createPayment({ membershipId: m.id, period: '2026-11', status: 'OVERDUE', dueDate: dueDateFor('2026-11', 15) });
    await expect(removeMember(m.id, owner.id)).rejects.toMatchObject({ code: 'membership/not-eligible-removal' });
  });

  it('expulsa con 2 cuotas OVERDUE, cancela cuotas, reabre el grupo y notifica', async () => {
    const { owner, member, group } = await setup({ status: 'FULL' });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: m.id, period: '2026-09', status: 'OVERDUE', dueDate: dueDateFor('2026-09', 15) });
    await createPayment({ membershipId: m.id, period: '2026-10', status: 'OVERDUE', dueDate: dueDateFor('2026-10', 15) });
    await createPayment({ membershipId: m.id, period: '2026-11', status: 'PENDING', dueDate: dueDateFor('2026-11', 15) });

    const removed = await removeMember(m.id, owner.id, { reason: 'Sin pagos' });
    expect(removed.status).toBe('REMOVED');
    const cycles = await prisma.paymentCycle.findMany({ where: { membershipId: m.id } });
    expect(cycles.every((c) => c.status === 'CANCELLED')).toBe(true);
    expect((await prisma.group.findUniqueOrThrow({ where: { id: group.id } })).status).toBe('OPEN');
    const note = await prisma.notification.findFirstOrThrow({ where: { userId: member.id, type: 'MEMBER_REMOVED' } });
    expect(note.body).toContain('Sin pagos');
  });

  it('solo el owner puede expulsar', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await expect(removeMember(m.id, member.id)).rejects.toMatchObject({ code: 'group/not-owner' });
  });
});

describe('fechas (Bogotá)', () => {
  it('calcula el período de la primera cuota', () => {
    expect(firstPeriod(new Date('2026-11-15T12:00:00Z'), 15)).toBe('2026-11');
    expect(firstPeriod(new Date('2026-11-16T12:00:00Z'), 15)).toBe('2026-12');
    expect(firstPeriod(new Date('2026-12-20T12:00:00Z'), 10)).toBe('2027-01');
  });

  it('usa el día local de Bogotá, no el UTC', () => {
    // 16 nov 02:00 UTC = 15 nov 21:00 en Bogotá
    expect(firstPeriod(new Date('2026-11-16T02:00:00Z'), 15)).toBe('2026-11');
  });

  it('calcula el fin del ciclo vigente', () => {
    expect(nextCycleEnd(new Date('2026-11-10T15:00:00Z'), 15)).toEqual(new Date('2026-11-15T05:00:00Z'));
    expect(nextCycleEnd(new Date('2026-11-20T15:00:00Z'), 15)).toEqual(new Date('2026-12-15T05:00:00Z'));
  });
});
