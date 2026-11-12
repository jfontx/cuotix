export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function intEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const rateLimitConfig = () => ({
  login: { limit: intEnv('RATE_LIMIT_LOGIN_MAX', 5), windowMs: 15 * 60 * 1000 },
  register: { limit: intEnv('RATE_LIMIT_REGISTER_MAX', 10), windowMs: 60 * 60 * 1000 },
  refresh: { limit: intEnv('RATE_LIMIT_REFRESH_MAX', 10), windowMs: 60 * 1000 },
});
