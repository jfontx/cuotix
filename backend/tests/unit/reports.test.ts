import { createReport, getReports, updateReport } from '../../src/services/reports';
import { createUser, setupActiveMembership } from '../helpers/factories';

const NIL = '00000000-0000-4000-8000-000000000000';

describe('createReport', () => {
  it('crea un reporte OPEN con motivo', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const report = await createReport(member.id, {
      groupId: group.id,
      reportedId: owner.id,
      reason: 'No dio acceso',
      detail: 'Pasaron 5 días',
    });
    expect(report).toMatchObject({ status: 'OPEN', reason: 'No dio acceso', reporterId: member.id });
  });

  it('el administrador puede reportar a un miembro', async () => {
    const { owner, member, group } = await setupActiveMembership();
    expect((await createReport(owner.id, { groupId: group.id, reportedId: member.id, reason: 'Spam' })).reportedId).toBe(
      member.id,
    );
  });

  it('falla contra uno mismo, un tercero o un grupo inexistente', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const stranger = await createUser();
    await expect(
      createReport(member.id, { groupId: group.id, reportedId: member.id, reason: 'Spam' }),
    ).rejects.toMatchObject({ code: 'general/forbidden' });
    await expect(
      createReport(stranger.id, { groupId: group.id, reportedId: owner.id, reason: 'Spam' }),
    ).rejects.toMatchObject({ code: 'general/forbidden' });
    await expect(
      createReport(member.id, { groupId: NIL, reportedId: owner.id, reason: 'Spam' }),
    ).rejects.toMatchObject({ code: 'general/not-found' });
  });
});

describe('getReports', () => {
  it('solo admin puede acceder', async () => {
    const { owner, member, group } = await setupActiveMembership();
    await createReport(member.id, { groupId: group.id, reportedId: owner.id, reason: 'Spam' });
    const admin = await createUser({ role: 'ADMIN' });

    await expect(getReports(member.id)).rejects.toMatchObject({ code: 'general/forbidden' });
    const list = await getReports(admin.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ reporter: { id: member.id }, reported: { id: owner.id } });
  });

  it('filtra por estado', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const admin = await createUser({ role: 'ADMIN' });
    const report = await createReport(member.id, { groupId: group.id, reportedId: owner.id, reason: 'Spam' });
    await updateReport(admin.id, report.id, { status: 'DISMISSED' });
    expect(await getReports(admin.id, { status: 'OPEN' })).toHaveLength(0);
    expect(await getReports(admin.id, { status: 'DISMISSED' })).toHaveLength(1);
  });
});

describe('updateReport', () => {
  it('cambia el estado (solo admin)', async () => {
    const { owner, member, group } = await setupActiveMembership();
    const admin = await createUser({ role: 'ADMIN' });
    const report = await createReport(member.id, { groupId: group.id, reportedId: owner.id, reason: 'Spam' });

    await expect(updateReport(member.id, report.id, { status: 'REVIEWED' })).rejects.toMatchObject({
      code: 'general/forbidden',
    });
    expect((await updateReport(admin.id, report.id, { status: 'REVIEWED' })).status).toBe('REVIEWED');
  });

  it('404 si no existe', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    await expect(updateReport(admin.id, NIL, { status: 'REVIEWED' })).rejects.toMatchObject({ code: 'general/not-found' });
  });
});
