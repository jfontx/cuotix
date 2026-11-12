import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers/auth';
import { createGroup, createMembership, createPayment, createUser } from '../helpers/factories';

const app = createApp();
const NIL = '00000000-0000-4000-8000-000000000000';

async function setup(groupData: Parameters<typeof createGroup>[0] = {}) {
  const owner = await createUser();
  const member = await createUser();
  const group = await createGroup({ ownerId: owner.id, ...groupData });
  return { owner, member, group };
}

describe('POST /groups/:id/join', () => {
  it('crea solicitud', async () => {
    const { member, group } = await setup();
    const res = await request(app).post(`/groups/${group.id}/join`).set(authHeader(member));
    expect(res.status).toBe(201);
    expect(res.body.membership).toMatchObject({ groupId: group.id, userId: member.id, status: 'PENDING' });
  });

  it('falla si ya es miembro (409)', async () => {
    const { member, group } = await setup();
    await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const res = await request(app).post(`/groups/${group.id}/join`).set(authHeader(member));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('group/already-member');
  });

  it('falla si grupo full (409)', async () => {
    const { member, group } = await setup({ slots: 1 });
    await createMembership({ groupId: group.id, userId: (await createUser()).id, status: 'ACTIVE' });
    const res = await request(app).post(`/groups/${group.id}/join`).set(authHeader(member));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('group/full');
  });

  it('404 si el grupo no existe y 401 sin token', async () => {
    const { member, group } = await setup();
    expect((await request(app).post(`/groups/${NIL}/join`).set(authHeader(member))).status).toBe(404);
    expect((await request(app).post(`/groups/${group.id}/join`)).status).toBe(401);
  });

  it('dos solicitudes simultáneas del mismo usuario crean una sola membresía', async () => {
    const { member, group } = await setup();
    const results = await Promise.all([
      request(app).post(`/groups/${group.id}/join`).set(authHeader(member)),
      request(app).post(`/groups/${group.id}/join`).set(authHeader(member)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.membership.count({ where: { groupId: group.id } })).toBe(1);
  });
});

describe('GET /groups/:id/members', () => {
  it('el owner ve solicitudes y miembros; el miembro activo solo ve activos', async () => {
    const { owner, member, group } = await setup();
    await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const pending = await createUser();
    await createMembership({ groupId: group.id, userId: pending.id });

    const asOwner = await request(app).get(`/groups/${group.id}/members`).set(authHeader(owner));
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.data).toHaveLength(2);

    const asMember = await request(app).get(`/groups/${group.id}/members`).set(authHeader(member));
    expect(asMember.status).toBe(200);
    expect(asMember.body.data).toHaveLength(1);
    expect(asMember.body.data[0]).not.toHaveProperty('firstAmount');
  });

  it('un usuario ajeno o pendiente recibe 403', async () => {
    const { member, group } = await setup();
    const stranger = await createUser();
    await createMembership({ groupId: group.id, userId: member.id });
    for (const u of [stranger, member]) {
      expect((await request(app).get(`/groups/${group.id}/members`).set(authHeader(u))).status).toBe(403);
    }
  });
});

describe('PATCH /memberships/:id/approve', () => {
  it('guarda firstAmount', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    const res = await request(app).patch(`/memberships/${m.id}/approve`).set(authHeader(owner)).send({ firstAmount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.membership).toMatchObject({ status: 'APPROVED', firstAmount: 5000 });
  });

  it('solo owner (403)', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    const res = await request(app).patch(`/memberships/${m.id}/approve`).set(authHeader(member)).send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('group/not-owner');
  });

  it('valida cupos concurrentes', async () => {
    const { owner, group } = await setup({ slots: 1 });
    const ms = await Promise.all(
      [1, 2, 3].map(async () => createMembership({ groupId: group.id, userId: (await createUser()).id })),
    );
    const results = await Promise.all(
      ms.map((m) => request(app).patch(`/memberships/${m.id}/approve`).set(authHeader(owner)).send({})),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409 && r.body.error.code === 'group/slots-exceeded')).toHaveLength(2);
    expect(await prisma.membership.count({ where: { groupId: group.id, status: 'APPROVED' } })).toBe(1);
  });

  it('rechaza firstAmount inválido y ids que no son UUID', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    const bad = await request(app).patch(`/memberships/${m.id}/approve`).set(authHeader(owner)).send({ firstAmount: -5 });
    expect(bad.status).toBe(400);
    const missing = await request(app).patch('/memberships/xyz/approve').set(authHeader(owner)).send({});
    expect(missing.status).toBe(404);
  });
});

describe('PATCH /memberships/:id/reject', () => {
  it('rechaza una solicitud pendiente, solo el owner', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id });
    expect((await request(app).patch(`/memberships/${m.id}/reject`).set(authHeader(member))).status).toBe(403);
    const res = await request(app).patch(`/memberships/${m.id}/reject`).set(authHeader(owner));
    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('REJECTED');
    const again = await request(app).patch(`/memberships/${m.id}/reject`).set(authHeader(owner));
    expect(again.status).toBe(409);
  });
});

describe('POST /memberships/:id/confirm-access', () => {
  it('crea cuota', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    const res = await request(app).post(`/memberships/${m.id}/confirm-access`).set(authHeader(member));
    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('ACTIVE');
    expect(await prisma.paymentCycle.count({ where: { membershipId: m.id } })).toBe(1);
  });

  it('solo el miembro (403)', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    expect((await request(app).post(`/memberships/${m.id}/confirm-access`).set(authHeader(owner))).status).toBe(403);
  });

  it('una doble confirmación simultánea crea una sola cuota', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'APPROVED' });
    const results = await Promise.all([
      request(app).post(`/memberships/${m.id}/confirm-access`).set(authHeader(member)),
      request(app).post(`/memberships/${m.id}/confirm-access`).set(authHeader(member)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.paymentCycle.count({ where: { membershipId: m.id } })).toBe(1);
  });
});

describe('POST /memberships/:id/leave', () => {
  it('el miembro sale y se libera el cupo', async () => {
    const { member, group } = await setup({ status: 'FULL' });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const res = await request(app).post(`/memberships/${m.id}/leave`).set(authHeader(member));
    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('LEFT');
    expect(res.body.membership.leavesAt).toBeTruthy();
    expect((await prisma.group.findUniqueOrThrow({ where: { id: group.id } })).status).toBe('OPEN');
  });
});

describe('POST /memberships/:id/remove', () => {
  it('requiere 2 OVERDUE (409)', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: m.id, status: 'OVERDUE' });
    const res = await request(app).post(`/memberships/${m.id}/remove`).set(authHeader(owner)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('membership/not-eligible-removal');
  });

  it('expulsa con 2 cuotas vencidas consecutivas', async () => {
    const { owner, member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: m.id, status: 'OVERDUE', period: '2026-10', dueDate: new Date('2026-10-15') });
    await createPayment({ membershipId: m.id, status: 'OVERDUE', period: '2026-11', dueDate: new Date('2026-11-15') });
    const res = await request(app).post(`/memberships/${m.id}/remove`).set(authHeader(owner)).send({ reason: 'No paga' });
    expect(res.status).toBe(200);
    expect(res.body.membership.status).toBe('REMOVED');
  });

  it('solo el owner (403)', async () => {
    const { member, group } = await setup();
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    expect((await request(app).post(`/memberships/${m.id}/remove`).set(authHeader(member)).send({})).status).toBe(403);
  });
});
