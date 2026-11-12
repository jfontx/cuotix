import { markOverdue } from "../../../src/jobs/markOverdue";
import { prisma } from "../../../src/lib/prisma";
import { setupPayment } from "../../helpers/factories";

const DUE = new Date("2026-11-15T05:00:00Z");
const day = (n: number) => new Date(DUE.getTime() + n * 86_400_000 + 1000);

describe("markOverdue", () => {
  it("marca OVERDUE después de 3 días de gracia", async () => {
    const { payment } = await setupPayment({ dueDate: DUE });
    expect(await markOverdue(day(3))).toBe(1);
    expect(
      (
        await prisma.paymentCycle.findUniqueOrThrow({
          where: { id: payment.id },
        })
      ).status,
    ).toBe("OVERDUE");
  });

  it("no marca dentro de días de gracia", async () => {
    const { payment } = await setupPayment({ dueDate: DUE });
    expect(await markOverdue(day(2))).toBe(0);
    expect(
      (
        await prisma.paymentCycle.findUniqueOrThrow({
          where: { id: payment.id },
        })
      ).status,
    ).toBe("PENDING");
  });

  it("ignora cuotas MARKED_PAID", async () => {
    const { payment } = await setupPayment({
      dueDate: DUE,
      status: "MARKED_PAID",
    });
    await markOverdue(day(10));
    expect(
      (
        await prisma.paymentCycle.findUniqueOrThrow({
          where: { id: payment.id },
        })
      ).status,
    ).toBe("MARKED_PAID");
  });

  it("ignora membresías no ACTIVE y grupos cerrados", async () => {
    const a = await setupPayment({ dueDate: DUE });
    await prisma.membership.update({
      where: { id: a.membership.id },
      data: { status: "LEFT" },
    });
    const b = await setupPayment({ dueDate: DUE });
    await prisma.group.update({
      where: { id: b.group.id },
      data: { status: "CLOSED" },
    });
    expect(await markOverdue(day(10))).toBe(0);
  });

  it("guarda overdueAt", async () => {
    const { payment } = await setupPayment({ dueDate: DUE });
    const now = day(5);
    await markOverdue(now);
    expect(
      (
        await prisma.paymentCycle.findUniqueOrThrow({
          where: { id: payment.id },
        })
      ).overdueAt,
    ).toEqual(now);
  });
});
