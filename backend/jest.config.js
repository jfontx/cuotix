module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Carga .env.test antes que cualquier módulo (ver tests/env.ts)
  setupFiles: ['./tests/env.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  maxWorkers: 1, // los tests comparten una sola BD
};
