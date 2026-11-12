import jwt from 'jsonwebtoken';

import type { User } from '../../generated/prisma/client';

export function generateToken(user: Pick<User, 'id' | 'email'>): string {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });
}

export function authHeader(user: Pick<User, 'id' | 'email'>): { Authorization: string } {
  return { Authorization: `Bearer ${generateToken(user)}` };
}
