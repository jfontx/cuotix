import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { createGroup, createMembership, createPayment, createUser, setupPayment } from '../helpers/factories';
import { authHeader } from '../helpers/auth';

describe('conexión a BD de prueba', () => {
  it('responde consultas', async () => {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    expect(result[0].ok).toBe(1);
  });

  it('usa la base de datos cuotix_test', async () => {
    const result = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    expect(result[0].db).toBe('cuotix_test');
  });
});

describe('migraciones', () => {
  it('todas las migraciones están aplicadas', async () => {
    const rows = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
      SELECT migration_name, finished_at FROM _prisma_migrations`;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.finished_at !== null)).toBe(true);
  });

  it('crea las tablas del schema', async () => {
    const rows = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    const names = rows.map((r) => r.tablename);
    for (const t of ['User', 'Service', 'Group', 'Membership', 'PaymentCycle', 'Rating', 'Report', 'PushToken', 'RefreshToken', 'Notification']) {
      expect(names).toContain(t);
    }
  });
});

describe('helpers de test', () => {
  it('crean la cadena usuario → grupo → membresía → cuota', async () => {
    const { payment, membership, group } = await setupPayment();
    expect(payment.membershipId).toBe(membership.id);
    expect(membership.groupId).toBe(group.id);
  });

  it('el limpiado entre tests deja la BD vacía', async () => {
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.group.count()).toBe(0);
  });

  it('factories sueltas funcionan y authHeader genera Bearer', async () => {
    const user = await createUser();
    const group = await createGroup({ ownerId: user.id });
    const m = await createMembership({ groupId: group.id, userId: (await createUser()).id });
    const p = await createPayment({ membershipId: m.id });
    expect(p.status).toBe('PENDING');
    expect(authHeader(user).Authorization).toMatch(/^Bearer .+/);
  });
});

describe('GET /health', () => {
  it('retorna ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
