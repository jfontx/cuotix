import jwt from 'jsonwebtoken';
import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers/auth';
import { TEST_PASSWORD, createUser } from '../helpers/factories';

const app = createApp();
const valid = { email: 'ana@example.com', password: 'Password123!', name: 'Ana Pérez' };

describe('POST /auth/register', () => {
  it('crea usuario y retorna tokens', async () => {
    const res = await request(app).post('/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: valid.email, name: valid.name, role: 'USER' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    const stored = await prisma.user.findUnique({ where: { email: valid.email } });
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await prisma.refreshToken.count({ where: { userId: stored!.id } })).toBe(1);
  });

  it('normaliza el correo a minúsculas', async () => {
    const res = await request(app).post('/auth/register').send({ ...valid, email: ' ANA@Example.com ' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@example.com');
  });

  it('rechaza email duplicado (409)', async () => {
    await request(app).post('/auth/register').send(valid);
    const res = await request(app).post('/auth/register').send(valid);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('auth/email-exists');
  });

  it('valida campos requeridos (400)', async () => {
    for (const body of [{}, { ...valid, email: 'no-es-correo' }, { ...valid, password: 'corta' }, { ...valid, name: '' }]) {
      const res = await request(app).post('/auth/register').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('validation/error');
    }
    expect(await prisma.user.count()).toBe(0);
  });
});

describe('POST /auth/login', () => {
  it('retorna tokens con credenciales válidas', async () => {
    const user = await createUser({ email: 'luis@example.com' });
    const res = await request(app).post('/auth/login').send({ email: 'LUIS@example.com', password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('rechaza credenciales inválidas (401)', async () => {
    await createUser({ email: 'luis@example.com' });
    const wrongPass = await request(app).post('/auth/login').send({ email: 'luis@example.com', password: 'incorrecta' });
    const unknown = await request(app).post('/auth/login').send({ email: 'nadie@example.com', password: TEST_PASSWORD });
    for (const res of [wrongPass, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('auth/invalid-credentials');
    }
  });
});

describe('POST /auth/refresh', () => {
  it('rota tokens correctamente', async () => {
    const { body: first } = await request(app).post('/auth/register').send(valid);
    const res = await request(app).post('/auth/refresh').send({ refreshToken: first.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(first.refreshToken);
    expect(await prisma.refreshToken.count()).toBe(1);
    // el nuevo token funciona
    const again = await request(app).post('/auth/refresh').send({ refreshToken: res.body.refreshToken });
    expect(again.status).toBe(200);
  });

  it('revoca todos si el token ya fue usado', async () => {
    const { body: first } = await request(app).post('/auth/register').send(valid);
    const { body: second } = await request(app).post('/auth/refresh').send({ refreshToken: first.refreshToken });
    const reuse = await request(app).post('/auth/refresh').send({ refreshToken: first.refreshToken });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('auth/token-revoked');
    expect(await prisma.refreshToken.count()).toBe(0);
    // el token legítimo más reciente también quedó revocado
    const res = await request(app).post('/auth/refresh').send({ refreshToken: second.refreshToken });
    expect(res.status).toBe(401);
  });

  it('rechaza tokens inválidos o ausentes', async () => {
    const bad = await request(app).post('/auth/refresh').send({ refreshToken: 'basura' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('auth/token-invalid');
    expect((await request(app).post('/auth/refresh').send({})).status).toBe(400);
  });
});

describe('POST /auth/logout', () => {
  it('invalida el refresh token y elimina el push token', async () => {
    const { body } = await request(app).post('/auth/register').send(valid);
    await prisma.pushToken.create({ data: { userId: body.user.id, token: 'ExponentPushToken[x]', platform: 'ios' } });
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .send({ refreshToken: body.refreshToken, pushToken: 'ExponentPushToken[x]' });
    expect(res.status).toBe(204);
    expect(await prisma.refreshToken.count()).toBe(0);
    expect(await prisma.pushToken.count()).toBe(0);
    const refresh = await request(app).post('/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(refresh.status).toBe(401);
  });

  it('requiere autenticación', async () => {
    const res = await request(app).post('/auth/logout').send({ refreshToken: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('GET /me', () => {
  it('retorna el usuario autenticado', async () => {
    const user = await createUser({ name: 'Marta' });
    const res = await request(app).get('/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, name: 'Marta' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rechaza sin token (401)', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('auth/token-invalid');
  });

  it('rechaza con token expirado (401)', async () => {
    const user = await createUser();
    const expired = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -10 });
    const res = await request(app).get('/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('auth/token-expired');
  });

  it('rechaza un token firmado con otro secreto (401)', async () => {
    const forged = jwt.sign({ sub: 'x', email: 'x@y.co' }, 'otro-secreto-de-al-menos-32-caracteres');
    const res = await request(app).get('/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /me', () => {
  it('actualiza nombre y teléfono', async () => {
    const user = await createUser();
    const res = await request(app).patch('/me').set(authHeader(user)).send({ name: 'Nuevo Nombre', phone: '3001234567' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Nuevo Nombre', phone: '3001234567' });
  });

  it('ignora campos no editables y valida el body', async () => {
    const user = await createUser();
    const res = await request(app).patch('/me').set(authHeader(user)).send({ role: 'ADMIN', email: 'x@y.co' });
    expect(res.status).toBe(400);
    expect((await prisma.user.findUnique({ where: { id: user.id } }))?.role).toBe('USER');
    const ok = await request(app).patch('/me').set(authHeader(user)).send({ name: 'Ok Nombre', role: 'ADMIN' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('USER');
  });

  it('rechaza sin token (401)', async () => {
    expect((await request(app).patch('/me').send({ name: 'Algo' })).status).toBe(401);
  });
});

describe('rate limiting', () => {
  const limited = createApp({ forceRateLimit: true });
  const attempt = () => request(limited).post('/auth/login').send({ email: 'x@example.com', password: 'mala' });

  it('bloquea login tras superar el límite por IP + correo', async () => {
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('rate-limit/exceeded');
    // otro correo tiene su propio contador
    const other = await request(limited).post('/auth/login').send({ email: 'otro@example.com', password: 'mala' });
    expect(other.status).toBe(401);
  });

  it('está desactivado por defecto en NODE_ENV=test', async () => {
    for (let i = 0; i < 7; i++) {
      expect((await request(app).post('/auth/login').send({ email: 'y@example.com', password: 'mala' })).status).toBe(401);
    }
  });
});
