import argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_SECONDS, requireEnv } from '../lib/config';

export interface AccessPayload {
  sub: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false; // hash con formato inválido
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, requireEnv('JWT_ACCESS_SECRET'), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, requireEnv('JWT_ACCESS_SECRET')) as AccessPayload;
  } catch (err) {
    throw new AppError(err instanceof jwt.TokenExpiredError ? 'auth/token-expired' : 'auth/token-invalid');
  }
}

/** Crea un refresh token (JWT con jti único) y guarda solo su hash. */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = jwt.sign({ sub: userId }, requireEnv('JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    jwtid: randomUUID(),
  });
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });
  return token;
}

/**
 * Valida un refresh token y retorna su registro en BD.
 * - Firma inválida o vencido → auth/token-invalid
 * - Firma válida pero sin registro (ya usado/revocado) → se revocan todos los
 *   tokens del usuario (posible robo) y se lanza auth/token-revoked
 */
export async function validateRefreshToken(token: string) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, requireEnv('JWT_REFRESH_SECRET')) as jwt.JwtPayload;
  } catch {
    throw new AppError('auth/token-invalid');
  }

  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record) {
    if (payload.sub) await revokeAllUserTokens(payload.sub);
    throw new AppError('auth/token-revoked');
  }
  if (record.expiresAt <= new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    throw new AppError('auth/token-invalid');
  }
  return record;
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function issueTokens(user: { id: string; email: string }) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: await generateRefreshToken(user.id),
  };
}

/** Rotación: consume el token recibido y emite un par nuevo. */
export async function rotateRefreshToken(token: string) {
  const record = await validateRefreshToken(token);
  // deleteMany es atómico: si dos requests usan el mismo token, solo una lo consume
  const { count } = await prisma.refreshToken.deleteMany({ where: { id: record.id } });
  if (count === 0) {
    await revokeAllUserTokens(record.userId);
    throw new AppError('auth/token-revoked');
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
  return issueTokens(user);
}

export async function revokeRefreshToken(userId: string, token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId, tokenHash: hashToken(token) } });
}
