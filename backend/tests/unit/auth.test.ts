import jwt from 'jsonwebtoken';

import { prisma } from '../../src/lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  revokeAllUserTokens,
  validateRefreshToken,
  verifyPassword,
} from '../../src/services/auth';
import { createUser } from '../helpers/factories';

describe('hashPassword / verifyPassword', () => {
  it('hashPassword genera un hash argon2id válido', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('Password123!');
  });

  it('verifyPassword valida correctamente', async () => {
    const hash = await hashPassword('Password123!');
    expect(await verifyPassword('Password123!', hash)).toBe(true);
    expect(await verifyPassword('otra-clave', hash)).toBe(false);
    expect(await verifyPassword('Password123!', 'no-es-un-hash')).toBe(false);
  });
});

describe('generateAccessToken', () => {
  it('crea un JWT válido de 15 minutos', () => {
    const token = generateAccessToken({ id: 'user-1', email: 'a@b.co' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.co');
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
  });
});

describe('refresh tokens', () => {
  it('generateRefreshToken crea token y guarda solo el hash', async () => {
    const user = await createUser();
    const token = await generateRefreshToken(user.id);
    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].tokenHash).not.toBe(token);
    expect(rows[0].expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000);
  });

  it('validateRefreshToken acepta un token vigente', async () => {
    const user = await createUser();
    const token = await generateRefreshToken(user.id);
    expect((await validateRefreshToken(token)).userId).toBe(user.id);
  });

  it('validateRefreshToken rechaza un token con firma inválida', async () => {
    await expect(validateRefreshToken('basura')).rejects.toMatchObject({ code: 'auth/token-invalid' });
    const forged = jwt.sign({ sub: 'x' }, 'otro-secreto-de-al-menos-32-caracteres');
    await expect(validateRefreshToken(forged)).rejects.toMatchObject({ code: 'auth/token-invalid' });
  });

  it('validateRefreshToken rechaza un token expirado', async () => {
    const user = await createUser();
    const token = await generateRefreshToken(user.id);
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(validateRefreshToken(token)).rejects.toMatchObject({ code: 'auth/token-invalid' });
  });

  it('validateRefreshToken sobre un token ya consumido revoca todos los del usuario', async () => {
    const user = await createUser();
    const used = await generateRefreshToken(user.id);
    await generateRefreshToken(user.id);
    await prisma.refreshToken.delete({ where: { tokenHash: hashToken(used) } });
    await expect(validateRefreshToken(used)).rejects.toMatchObject({ code: 'auth/token-revoked' });
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it('revokeAllUserTokens elimina todos los refresh tokens del usuario', async () => {
    const a = await createUser();
    const b = await createUser();
    await generateRefreshToken(a.id);
    await generateRefreshToken(a.id);
    await generateRefreshToken(b.id);
    await revokeAllUserTokens(a.id);
    expect(await prisma.refreshToken.count({ where: { userId: a.id } })).toBe(0);
    expect(await prisma.refreshToken.count({ where: { userId: b.id } })).toBe(1);
  });
});
