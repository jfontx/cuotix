import type { User } from '../../generated/prisma/client';

export function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
