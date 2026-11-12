import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers/auth';
import {
  createGroup,
  createMembership,
  createPayment,
  createService,
  createUser,
} from '../helpers/factories';

const app = createApp();
const body = (serviceId: string, over = {}) => ({
  serviceId,
  title: 'Spotify del barrio',
  description: 'Cupos para vecinos',
  pricePerMember: 8000,
  paymentDay: 15,
  slots: 4,
  payoutMethod: 'nequi',
  payoutDetail: '3001234567',
  ...over,
});

describe('autenticación', () => {
  it('exige token en /groups y /services', async () => {
    for (const path of ['/groups', '/groups/x', '/services', '/services/x']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });
});

describe('GET /services', () => {
  it('lista el catálogo y retorna el detalle', async () => {
    const user = await createUser();
    const service = await createService({ name: 'Servicio de prueba A' });
    const list = await request(app).get('/services').set(authHeader(user));
    expect(list.status).toBe(200);
    expect(list.body.data.map((s: { id: string }) => s.id)).toContain(service.id);

    const detail = await request(app).get(`/services/${service.id}`).set(authHeader(user));
    expect(detail.status).toBe(200);
    expect(detail.body.service).toMatchObject({ id: service.id, name: 'Servicio de prueba A', maxMembers: 6 });
  });

  it('retorna 404 si no existe o el id es inválido', async () => {
    const user = await createUser();
    for (const id of ['00000000-0000-4000-8000-000000000000', 'no-es-uuid']) {
      const res = await request(app).get(`/services/${id}`).set(authHeader(user));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('general/not-found');
    }
  });
});

describe('POST /groups', () => {
  it('crea grupo correctamente', async () => {
    const user = await createUser();
    const service = await createService();
    const res = await request(app).post('/groups').set(authHeader(user)).send(body(service.id));
    expect(res.status).toBe(201);
    expect(res.body.group).toMatchObject({
      ownerId: user.id,
      status: 'OPEN',
      slots: 4,
      availableSlots: 4,
      payoutDetail: '3001234567',
      service: { id: service.id },
    });
    expect(await prisma.group.count({ where: { ownerId: user.id } })).toBe(1);
  });

  it('valida slots vs maxMembers (400)', async () => {
    const user = await createUser();
    const service = await createService({ maxMembers: 2 });
    const res = await request(app).post('/groups').set(authHeader(user)).send(body(service.id, { slots: 2 }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation/error');
    expect(res.body.error.details[0].field).toBe('slots');
    expect(await prisma.group.count()).toBe(0);
  });

  it('valida campos requeridos (400)', async () => {
    const user = await createUser();
    const service = await createService();
    for (const bad of [{}, body(service.id, { title: 'a' }), body(service.id, { paymentDay: 31 }), body(service.id, { pricePerMember: 0 }), body('no-uuid')]) {
      const res = await request(app).post('/groups').set(authHeader(user)).send(bad);
      expect(res.status).toBe(400);
    }
  });
});

describe('GET /groups', () => {
  it('retorna solo grupos OPEN por defecto y nunca payoutDetail', async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const open = await createGroup({ ownerId: owner.id });
    await createGroup({ ownerId: owner.id, status: 'CLOSED' });
    await createGroup({ ownerId: owner.id, status: 'PAUSED' });
    const res = await request(app).get('/groups').set(authHeader(viewer));
    expect(res.status).toBe(200);
    expect(res.body.data.map((g: { id: string }) => g.id)).toEqual([open.id]);
    expect(JSON.stringify(res.body)).not.toContain('3001234567');
    expect(res.body.data[0].availableSlots).toBe(4);
  });

  it('filtra por serviceId, precio, búsqueda y excludeMine', async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const s1 = await createService();
    const s2 = await createService();
    const g1 = await createGroup({ ownerId: owner.id, serviceId: s1.id, pricePerMember: 5000, title: 'Música Spotify' });
    const g2 = await createGroup({ ownerId: owner.id, serviceId: s2.id, pricePerMember: 9000, title: 'Series', description: 'netflix hogar' });
    const mine = await createGroup({ ownerId: viewer.id, serviceId: s1.id, pricePerMember: 5000 });
    const ids = async (qs: string) =>
      ((await request(app).get(`/groups?${qs}`).set(authHeader(viewer))).body.data as { id: string }[]).map((g) => g.id).sort();

    expect(await ids(`serviceId=${s2.id}`)).toEqual([g2.id]);
    expect(await ids(`serviceId=${s1.id}`)).toEqual([g1.id, mine.id].sort());
    expect(await ids('minPrice=6000')).toEqual([g2.id]);
    expect(await ids('maxPrice=5000')).toEqual([g1.id, mine.id].sort());
    expect(await ids('search=SPOTIFY')).toEqual([g1.id]);
    expect(await ids('search=netflix')).toEqual([g2.id]);
    expect(await ids('excludeMine=true')).toEqual([g1.id, g2.id].sort());
    expect(await ids('status=CLOSED')).toEqual([]);
  });

  it('mine=true lista los grupos propios y en los que participo', async () => {
    const owner = await createUser();
    const me = await createUser();
    const own = await createGroup({ ownerId: me.id, status: 'PAUSED' });
    const joined = await createGroup({ ownerId: owner.id });
    const requested = await createGroup({ ownerId: owner.id });
    const left = await createGroup({ ownerId: owner.id });
    await createGroup({ ownerId: owner.id });
    await createMembership({ groupId: joined.id, userId: me.id, status: 'ACTIVE' });
    await createMembership({ groupId: requested.id, userId: me.id, status: 'PENDING' });
    await createMembership({ groupId: left.id, userId: me.id, status: 'LEFT' });
    const res = await request(app).get('/groups?mine=true').set(authHeader(me));
    expect(res.body.data.map((g: { id: string }) => g.id).sort()).toEqual([own.id, joined.id, requested.id].sort());
  });

  it('paginación funciona', async () => {
    const owner = await createUser();
    const viewer = await createUser();
    for (let i = 0; i < 5; i++) await createGroup({ ownerId: owner.id, title: `Grupo ${i}` });
    const p1 = await request(app).get('/groups?page=1&limit=2').set(authHeader(viewer));
    const p3 = await request(app).get('/groups?page=3&limit=2').set(authHeader(viewer));
    expect(p1.body.data).toHaveLength(2);
    expect(p1.body.pagination).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
    expect(p3.body.data).toHaveLength(1);
    const p2 = await request(app).get('/groups?page=2&limit=2').set(authHeader(viewer));
    const all = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((g: { id: string }) => g.id);
    expect(new Set(all).size).toBe(5);
  });

  it('rechaza parámetros inválidos (400)', async () => {
    const user = await createUser();
    for (const qs of ['limit=101', 'page=0', 'status=NOPE', 'serviceId=x', 'minPrice=abc']) {
      const res = await request(app).get(`/groups?${qs}`).set(authHeader(user));
      expect(res.status).toBe(400);
    }
  });
});

describe('GET /groups/:id', () => {
  it('oculta payoutDetail a extraños', async () => {
    const group = await createGroup();
    const stranger = await createUser();
    const res = await request(app).get(`/groups/${group.id}`).set(authHeader(stranger));
    expect(res.status).toBe(200);
    expect(res.body.group.title).toBe('Test Group');
    expect(res.body.group).not.toHaveProperty('payoutDetail');
    expect(res.body.group.isOwner).toBe(false);
  });

  it('muestra payoutDetail a miembros y al owner', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    const m = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const asMember = await request(app).get(`/groups/${group.id}`).set(authHeader(member));
    expect(asMember.body.group.payoutDetail).toBe('3001234567');
    expect(asMember.body.group.myMembership).toEqual({ id: m.id, status: 'ACTIVE' });
    const asOwner = await request(app).get(`/groups/${group.id}`).set(authHeader(owner));
    expect(asOwner.body.group.payoutDetail).toBe('3001234567');
  });

  it('retorna 404 si no existe', async () => {
    const user = await createUser();
    for (const id of ['00000000-0000-4000-8000-000000000000', 'no-uuid']) {
      expect((await request(app).get(`/groups/${id}`).set(authHeader(user))).status).toBe(404);
    }
  });
});

describe('PATCH /groups/:id', () => {
  it('el owner actualiza el grupo', async () => {
    const owner = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    const res = await request(app).patch(`/groups/${group.id}`).set(authHeader(owner)).send({ title: 'Nuevo título', status: 'PAUSED' });
    expect(res.status).toBe(200);
    expect(res.body.group).toMatchObject({ title: 'Nuevo título', status: 'PAUSED' });
  });

  it('solo owner puede editar (403)', async () => {
    const group = await createGroup();
    const other = await createUser();
    const res = await request(app).patch(`/groups/${group.id}`).set(authHeader(other)).send({ title: 'Hackeado' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('group/not-owner');
    expect((await prisma.group.findUnique({ where: { id: group.id } }))?.title).toBe('Test Group');
  });

  it('rechaza cambios inválidos y no permite cambiar owner o servicio', async () => {
    const owner = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    for (const bad of [{}, { slots: 99 }, { status: 'CLOSED' }, { paymentDay: 0 }]) {
      const res = await request(app).patch(`/groups/${group.id}`).set(authHeader(owner)).send(bad);
      expect(res.status).toBe(400);
    }
    const other = await createUser();
    const res = await request(app).patch(`/groups/${group.id}`).set(authHeader(owner)).send({ title: 'Título ok', ownerId: other.id });
    expect(res.status).toBe(200);
    expect(res.body.group.ownerId).toBe(owner.id);
  });

  it('valida cupos contra el máximo del servicio (400) y los ocupados (409)', async () => {
    const owner = await createUser();
    const member = await createUser();
    const service = await createService({ maxMembers: 4 });
    const group = await createGroup({ ownerId: owner.id, serviceId: service.id, slots: 3 });
    await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const tooMany = await request(app).patch(`/groups/${group.id}`).set(authHeader(owner)).send({ slots: 4 });
    expect(tooMany.status).toBe(400);
    const under = await createGroup({ ownerId: owner.id, slots: 3 });
    const [a, b] = [await createUser(), await createUser()];
    await createMembership({ groupId: under.id, userId: a.id, status: 'ACTIVE' });
    await createMembership({ groupId: under.id, userId: b.id, status: 'APPROVED' });
    const res = await request(app).patch(`/groups/${under.id}`).set(authHeader(owner)).send({ slots: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('group/slots-exceeded');
  });
});

describe('POST /groups/:id/close', () => {
  it('cierra y cancela cuotas', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    const membership = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const payment = await createPayment({ membershipId: membership.id, status: 'PENDING' });
    const res = await request(app).post(`/groups/${group.id}/close`).set(authHeader(owner));
    expect(res.status).toBe(200);
    expect(res.body.group.status).toBe('CLOSED');
    expect((await prisma.paymentCycle.findUnique({ where: { id: payment.id } }))?.status).toBe('CANCELLED');
  });

  it('falla con pagos pendientes de confirmar (409)', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    const membership = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: membership.id, status: 'MARKED_PAID' });
    const res = await request(app).post(`/groups/${group.id}/close`).set(authHeader(owner));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('group/has-pending-payments');
    expect((await prisma.group.findUnique({ where: { id: group.id } }))?.status).toBe('OPEN');
  });

  it('solo el owner puede cerrar (403) y no se cierra dos veces (409)', async () => {
    const owner = await createUser();
    const group = await createGroup({ ownerId: owner.id });
    const other = await createUser();
    expect((await request(app).post(`/groups/${group.id}/close`).set(authHeader(other))).status).toBe(403);
    await request(app).post(`/groups/${group.id}/close`).set(authHeader(owner));
    const again = await request(app).post(`/groups/${group.id}/close`).set(authHeader(owner));
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('group/closed');
  });
});
