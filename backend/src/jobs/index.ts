import cron from 'node-cron';

import { generatePaymentCycles } from './generatePayments';
import { markOverdue } from './markOverdue';
import { sendReminders } from './sendReminders';

const TIMEZONE = 'America/Bogota';

/** Orden importa: generar → marcar atrasos → avisar. */
export async function runAllJobs(now = new Date()) {
  const generated = await generatePaymentCycles(now);
  const overdue = await markOverdue(now);
  const reminders = await sendReminders(now);
  return { generated, overdue, reminders };
}

async function safely(name: string, job: () => Promise<unknown>) {
  try {
    await job();
  } catch (err) {
    console.error(`Falló el job ${name}`, err);
  }
}

export function scheduleJobs() {
  const opts = { timezone: TIMEZONE };
  cron.schedule('5 0 * * *', () => safely('generatePaymentCycles', () => generatePaymentCycles(new Date())), opts);
  cron.schedule('10 0 * * *', () => safely('markOverdue', () => markOverdue(new Date())), opts);
  cron.schedule('0 9 * * *', () => safely('sendReminders', () => sendReminders(new Date())), opts);
}
