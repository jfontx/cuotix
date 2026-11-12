import { prisma } from '../../src/lib/prisma';
import { closeGroup, createGroup, getGroupDetail, updateGroup } from '../../src/services/groups';
import { SERVICES, seedServices } from '../../prisma/seed';
import { createGroup as makeGroup, createMembership, createPayment, createService, createUser } from '../helpers/factories';

const input = (serviceId: string, over = {}) => ({
  serviceId,
  title: 'Spotify del barrio',
  pricePerMember: 8000,
  paymentDay: 15,
  slots: 4,
  payoutMethod: 'nequi',
  payoutDetail: '3001234567',
  ...over,
});

describe('createGroup', () => {
  it('valida slots <= maxMembers - 1', async () => {
    const user = await createUser();
    const service = await createService({ maxMembers: 6 });
    await expect(createGroup(user.id, input(service.id, { slots: 6 }))).rejects.toMatchObject({
      code: 'validation/error',
      details: [{ field: 'slots', message: expect.any(String) }],
    });
    await expect(createGroup(user.id, input(service.id, { slots: 5 }))).resolves.toBeDefined();
  });

  it('asigna owner correctamente', async () => {
    const user = await createUser();
    const service = await createService();
    const group = await createGroup(user.id, input(service.id));
    expect(group.ownerId).toBe(user.id);
    expect(group.status).toBe('OPEN');
    expect(group.availableSlots).toBe(4);
  });

  it('rechaza un servicio inexistente', async () => {
    const user = await createUser();
    await expect(
      createGroup(user.id, input('00000000-0000-4000-8000-000000000000')),
    ).rejects.toMatchObject({ code: 'validation/error' });
  });
});

describe('updateGroup', () => {
  it('solo permite al owner', async () => {
    const owner = await createUser();
    const other = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    await expect(updateGroup(group.id, other.id, { title: 'Nuevo' })).rejects.toMatchObject({ code: 'group/not-owner' });
    const updated = await updateGroup(group.id, owner.id, { title: 'Nuevo' });
    expect(updated.title).toBe('Nuevo');
  });

  it('no permite bajar los cupos por debajo de los ocupados', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await makeGroup({ ownerId: owner.id, slots: 4 });
    await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await expect(updateGroup(group.id, owner.id, { slots: 0 as number })).rejects.toBeDefined();
    await expect(updateGroup(group.id, owner.id, { slots: 1 })).resolves.toMatchObject({ slots: 1 });
  });

  it('no permite editar un grupo cerrado', async () => {
    const owner = await createUser();
    const group = await makeGroup({ ownerId: owner.id, status: 'CLOSED' });
    await expect(updateGroup(group.id, owner.id, { title: 'Nuevo' })).rejects.toMatchObject({ code: 'group/closed' });
  });
});

describe('closeGroup', () => {
  it('cambia estado a CLOSED y cancela cuotas pendientes', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    const membership = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    const pending = await createPayment({ membershipId: membership.id, status: 'PENDING' });
    const confirmed = await createPayment({ membershipId: membership.id, status: 'CONFIRMED', period: '2026-10' });

    const closed = await closeGroup(group.id, owner.id);
    expect(closed.status).toBe('CLOSED');
    expect((await prisma.paymentCycle.findUnique({ where: { id: pending.id } }))?.status).toBe('CANCELLED');
    expect((await prisma.paymentCycle.findUnique({ where: { id: confirmed.id } }))?.status).toBe('CONFIRMED');
  });

  it('falla si hay pagos MARKED_PAID', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    const membership = await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    await createPayment({ membershipId: membership.id, status: 'MARKED_PAID' });
    await expect(closeGroup(group.id, owner.id)).rejects.toMatchObject({ code: 'group/has-pending-payments' });
    expect((await prisma.group.findUnique({ where: { id: group.id } }))?.status).toBe('OPEN');
  });

  it('solo permite al owner y no cierra dos veces', async () => {
    const owner = await createUser();
    const other = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    await expect(closeGroup(group.id, other.id)).rejects.toMatchObject({ code: 'group/not-owner' });
    await closeGroup(group.id, owner.id);
    await expect(closeGroup(group.id, owner.id)).rejects.toMatchObject({ code: 'group/closed' });
  });
});

describe('getGroupDetail', () => {
  it('oculta payoutDetail a no miembros', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    const result = await getGroupDetail(group.id, stranger.id);
    expect(result).not.toHaveProperty('payoutDetail');
    expect(result.myMembership).toBeNull();
  });

  it('oculta payoutDetail a solicitudes PENDING', async () => {
    const owner = await createUser();
    const applicant = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    await createMembership({ groupId: group.id, userId: applicant.id, status: 'PENDING' });
    expect(await getGroupDetail(group.id, applicant.id)).not.toHaveProperty('payoutDetail');
  });

  it('muestra payoutDetail a miembros ACTIVE y al owner', async () => {
    const owner = await createUser();
    const member = await createUser();
    const group = await makeGroup({ ownerId: owner.id });
    await createMembership({ groupId: group.id, userId: member.id, status: 'ACTIVE' });
    expect((await getGroupDetail(group.id, member.id)).payoutDetail).toBe('3001234567');
    const asOwner = await getGroupDetail(group.id, owner.id);
    expect(asOwner.payoutDetail).toBe('3001234567');
    expect(asOwner.isOwner).toBe(true);
  });

  it('calcula los cupos disponibles', async () => {
    const owner = await createUser();
    const [a, b, c] = [await createUser(), await createUser(), await createUser()];
    const group = await makeGroup({ ownerId: owner.id, slots: 4 });
    await createMembership({ groupId: group.id, userId: a.id, status: 'ACTIVE' });
    await createMembership({ groupId: group.id, userId: b.id, status: 'APPROVED' });
    await createMembership({ groupId: group.id, userId: c.id, status: 'PENDING' });
    expect(await getGroupDetail(group.id, owner.id)).toMatchObject({ occupiedSlots: 2, availableSlots: 2 });
  });

  it('lanza not-found si no existe', async () => {
    const user = await createUser();
    await expect(getGroupDetail('00000000-0000-4000-8000-000000000000', user.id)).rejects.toMatchObject({
      code: 'general/not-found',
    });
  });
});

describe('seedServices', () => {
  it('carga el catálogo y es idempotente', async () => {
    await seedServices(prisma);
    await seedServices(prisma);
    const names = (await prisma.service.findMany({ where: { name: { in: SERVICES.map((s) => s.name) } } })).map(
      (s) => s.name,
    );
    expect(names.sort()).toEqual(SERVICES.map((s) => s.name).sort());
    expect(SERVICES.map((s) => s.name)).toEqual(
      expect.arrayContaining(['Spotify Premium Familiar', 'YouTube Premium Familiar', 'Netflix (Miembro Extra)']),
    );
  });
});
