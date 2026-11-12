import { prisma } from '../src/lib/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.rating.deleteMany(),
    prisma.report.deleteMany(),
    prisma.paymentCycle.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.group.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});
