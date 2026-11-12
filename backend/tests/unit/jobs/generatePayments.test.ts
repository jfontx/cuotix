import { generatePaymentCycles } from "../../../src/jobs/generatePayments";
import { prisma } from "../../../src/lib/prisma";
import {
  createGroup,
  createMembership,
  createUser,
} from "../../helpers/factories";

const NOW = new Date("2026-11-12T15:00:00Z");

async function setup(
  group: Parameters<typeof createGroup>[0] = {},
  status: Parameters<typeof createMembership>[0]["status"] = "ACTIVE",
) {
  const g = await createGroup(group);
  const user = await createUser();
  const membership = await createMembership({
    groupId: g.id,
    userId: user.id,
    status,
  });
  return { group: g, membership };
}

describe("generatePaymentCycles", () => {
  it("genera cuotas para membresías ACTIVE", async () => {
    const { membership } = await setup({
      pricePerMember: 9000,
      paymentDay: 20,
    });
    expect(await generatePaymentCycles(NOW)).toBe(1);
    const cycle = await prisma.paymentCycle.findFirstOrThrow({
      where: { membershipId: membership.id },
    });
    expect(cycle).toMatchObject({
      period: "2026-12",
      amount: 9000,
      status: "PENDING",
    });
    expect(cycle.dueDate).toEqual(new Date("2026-12-20T05:00:00Z"));
  });

  it("ignora grupos CLOSED y PAUSED", async () => {
    await setup({ status: "CLOSED" });
    await setup({ status: "PAUSED" });
    expect(await generatePaymentCycles(NOW)).toBe(0);
    expect(await prisma.paymentCycle.count()).toBe(0);
  });

  it("ignora membresías LEFT/REMOVED/PENDING", async () => {
    await setup({}, "LEFT");
    await setup({}, "REMOVED");
    await setup({}, "PENDING");
    expect(await generatePaymentCycles(NOW)).toBe(0);
  });

  it("es idempotente (no duplica)", async () => {
    await setup();
    await generatePaymentCycles(NOW);
    expect(await generatePaymentCycles(NOW)).toBe(0);
    expect(await prisma.paymentCycle.count()).toBe(1);
  });

  it("usa timezone America/Bogota", async () => {
    await setup();
    // 2026-12-01 02:00 UTC sigue siendo 30 de noviembre en Bogotá → siguiente período = diciembre
    await generatePaymentCycles(new Date("2026-12-01T02:00:00Z"));
    expect((await prisma.paymentCycle.findFirstOrThrow()).period).toBe(
      "2026-12",
    );
  });
});
