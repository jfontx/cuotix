import { createRating, getUserRatings } from '../../src/services/ratings';
import { createMembership, createPayment, createUser, setupActiveMembership } from '../helpers/factories';

async function eligibleSetup() {
  const ctx = await setupActiveMembership();
  await createPayment({ membershipId: ctx.membership.id, status: 'CONFIRMED' });
  return ctx;
}

describe('createRating', () => {
  it('valida elegibilidad: cuota CONFIRMED permite calificar en ambos sentidos', async () => {
    const { owner, member, group } = await eligibleSetup();
    const a = await createRating(member.id, { groupId: group.id, toId: owner.id, score: 5, comment: 'Excelente' });
    expect(a).toMatchObject({ fromId: member.id, toId: owner.id, score: 5 });
    const b = await createRating(owner.id, { groupId: group.id, toId: member.id, score: 4 });
    expect(b.score).toBe(4);
  });

  it('valida elegibilidad: membresía LEFT permite calificar', async () => {
    const { owner, group } = await eligibleSetup();
    const leaver = await createUser();
    await createMembership({ groupId: group.id, userId: leaver.id, status: 'LEFT' });
    expect((await createRating(leaver.id, { groupId: group.id, toId: owner.id, score: 3 })).score).toBe(3);
  });

  it('falla si la cuota no está confirmada', async () => {
    const { owner, member, group, membership } = await setupActiveMembership();
    await createPayment({ membershipId: membership.id, status: 'PENDING' });
    await expect(createRating(member.id, { groupId: group.id, toId: owner.id, score: 5 })).rejects.toMatchObject({
      code: 'rating/not-eligible',
    });
  });

  it('falla entre dos miembros, a sí mismo o con un tercero', async () => {
    const { owner, member, group } = await eligibleSetup();
    const stranger = await createUser();
    const other = await createUser();
    await createMembership({ groupId: group.id, userId: other.id, status: 'LEFT' });
    await expect(createRating(member.id, { groupId: group.id, toId: other.id, score: 5 })).rejects.toMatchObject({
      code: 'rating/not-eligible',
    });
    await expect(createRating(member.id, { groupId: group.id, toId: member.id, score: 5 })).rejects.toMatchObject({
      code: 'rating/not-eligible',
    });
    await expect(createRating(stranger.id, { groupId: group.id, toId: owner.id, score: 5 })).rejects.toMatchObject({
      code: 'rating/not-eligible',
    });
  });

  it('falla si ya calificó', async () => {
    const { owner, member, group } = await eligibleSetup();
    await createRating(member.id, { groupId: group.id, toId: owner.id, score: 5 });
    await expect(createRating(member.id, { groupId: group.id, toId: owner.id, score: 1 })).rejects.toMatchObject({
      code: 'rating/already-rated',
    });
  });

  it('la base de datos mantiene la unicidad ante peticiones simultáneas', async () => {
    const { owner, member, group } = await eligibleSetup();
    const results = await Promise.allSettled(
      [5, 4].map((score) => createRating(member.id, { groupId: group.id, toId: owner.id, score })),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
});

describe('getUserRatings', () => {
  it('calcula promedio y total', async () => {
    const { owner, member, group } = await eligibleSetup();
    const second = await createUser();
    await createMembership({ groupId: group.id, userId: second.id, status: 'LEFT' });
    await createRating(member.id, { groupId: group.id, toId: owner.id, score: 5 });
    await createRating(second.id, { groupId: group.id, toId: owner.id, score: 4, comment: 'Bien' });

    const result = await getUserRatings(owner.id);
    expect(result.average).toBe(4.5);
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({ group: { id: group.id }, from: { id: expect.any(String) } });
  });

  it('sin calificaciones: promedio null', async () => {
    const user = await createUser();
    expect(await getUserRatings(user.id)).toMatchObject({ average: null, count: 0, data: [] });
  });

  it('pagina y falla si el usuario no existe', async () => {
    const { owner, member, group } = await eligibleSetup();
    await createRating(member.id, { groupId: group.id, toId: owner.id, score: 5 });
    expect((await getUserRatings(owner.id, 2, 1)).data).toHaveLength(0);
    await expect(getUserRatings('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({
      code: 'general/not-found',
    });
  });
});
