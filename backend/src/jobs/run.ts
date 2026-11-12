import 'dotenv/config';

import { prisma } from '../lib/prisma';
import { runAllJobs } from './index';

/** `npm run jobs:run [-- --date=YYYY-MM-DD]`: ejecuta los jobs simulando una fecha (mediodía de Bogotá). */
async function main() {
  const arg = process.argv.find((a) => a.startsWith('--date='))?.slice('--date='.length);
  let now = new Date();
  if (arg) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(arg) || Number.isNaN(Date.parse(arg))) {
      throw new Error('Fecha inválida, usa --date=YYYY-MM-DD');
    }
    now = new Date(`${arg}T12:00:00-05:00`);
  }
  console.log(`Ejecutando jobs con fecha ${now.toISOString()}`, await runAllJobs(now));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
