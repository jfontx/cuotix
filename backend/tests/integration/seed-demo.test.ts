import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { DEMO_PASSWORD, DEMO_USERS, resetDemo } from '../../prisma/seed-demo';

const NOW = new Date('2026-11-12T17:00:00.000Z');
const app = createApp();

describe('seed de demo', () => {
  beforeEach(() => resetDemo(prisma as never, NOW));

  it('crea usuarios, grupos, membresías y cuotas en cada estado', async () => {
    expect(await prisma.user.count()).toBe(DEMO_USERS.length);
    expect(await prisma.group.count()).toBe(3);
    const statuses = (await prisma.paymentCycle.findMany()).map((p) => p.status);
    expect(new Set(statuses)).toEqual(new Set(['CONFIRMED', 'MARKED_PAID', 'OVERDUE', 'PENDING']));
    const memberships = (await prisma.membership.findMany()).map((m) => m.status);
    expect(new Set(memberships)).toEqual(new Set(['ACTIVE', 'PENDING', 'APPROVED']));
    expect(await prisma.rating.count()).toBeGreaterThan(0);
    expect(await prisma.report.count()).toBe(1);
  });

  it('es repetible: ejecutarlo dos veces deja el mismo estado', async () => {
    await resetDemo(prisma as never, NOW);
    expect(await prisma.user.count()).toBe(DEMO_USERS.length);
    expect(await prisma.service.count()).toBe(3);
  });

  it('las cuotas son relativas a la fecha dada', async () => {
    const periods = (await prisma.paymentCycle.findMany()).map((p) => p.period);
    expect(new Set(periods)).toEqual(new Set(['2026-10', '2026-11']));
  });

  it('los usuarios de demo pueden iniciar sesión y ver sus datos', async () => {
    const login = await request(app).post('/auth/login').send({ email: 'owner@example.com', password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    const mine = await request(app).get('/groups?mine=true').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(mine.body.data.length).toBe(3);
  });

  it('el moderador puede ver los reportes', async () => {
    const login = await request(app).post('/auth/login').send({ email: 'moderator@example.com', password: DEMO_PASSWORD });
    const reports = await request(app).get('/reports').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(reports.status).toBe(200);
    expect(reports.body.data).toHaveLength(1);
  });
});
