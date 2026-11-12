import { sendReminders } from "../../../src/jobs/sendReminders";
import { prisma } from "../../../src/lib/prisma";
import {
  setPushSender,
  type PushMessage,
} from "../../../src/services/notifications";
import { setupPayment } from "../../helpers/factories";

const DUE = new Date("2026-11-15T05:00:00Z"); // 15 nov 00:00 Bogotá
const at = (iso: string) => new Date(iso);

afterEach(() => setPushSender(null));

describe("sendReminders", () => {
  it("envía recordatorio 2 días antes", async () => {
    const { member, payment } = await setupPayment({ dueDate: DUE });
    expect(await sendReminders(at("2026-11-13T14:00:00Z"))).toBe(1);
    const n = await prisma.notification.findFirstOrThrow({
      where: { userId: member.id },
    });
    expect(n).toMatchObject({
      type: "PAYMENT_REMINDER",
      paymentId: payment.id,
    });
    expect(n.body).toContain("vence en 2 días");
  });

  it("envía recordatorio el día del vencimiento", async () => {
    const { member } = await setupPayment({ dueDate: DUE });
    expect(await sendReminders(at("2026-11-15T14:00:00Z"))).toBe(1);
    const n = await prisma.notification.findFirstOrThrow({
      where: { userId: member.id },
    });
    expect(n.body).toContain("vence hoy");
  });

  it("no envía otros días", async () => {
    await setupPayment({ dueDate: DUE });
    expect(await sendReminders(at("2026-11-12T14:00:00Z"))).toBe(0);
    expect(await sendReminders(at("2026-11-14T14:00:00Z"))).toBe(0);
  });

  it("envía notificación a cuotas OVERDUE", async () => {
    const { member } = await setupPayment({ dueDate: DUE, status: "OVERDUE" });
    expect(await sendReminders(at("2026-11-19T14:00:00Z"))).toBe(1);
    expect(
      (
        await prisma.notification.findFirstOrThrow({
          where: { userId: member.id },
        })
      ).type,
    ).toBe("PAYMENT_OVERDUE");
  });

  it("no duplica notificaciones (unique constraint)", async () => {
    await setupPayment({ dueDate: DUE });
    const now = at("2026-11-13T14:00:00Z");
    await sendReminders(now);
    expect(await sendReminders(now)).toBe(0);
    expect(await prisma.notification.count()).toBe(1);
  });

  it("ignora membresías no ACTIVE y cuotas ya pagadas", async () => {
    const a = await setupPayment({ dueDate: DUE });
    await prisma.membership.update({
      where: { id: a.membership.id },
      data: { status: "LEFT" },
    });
    await setupPayment({ dueDate: DUE, status: "MARKED_PAID" });
    expect(await sendReminders(at("2026-11-13T14:00:00Z"))).toBe(0);
  });

  it("envía el push a los dispositivos del usuario", async () => {
    const { member } = await setupPayment({ dueDate: DUE });
    await prisma.pushToken.create({
      data: {
        userId: member.id,
        token: "ExponentPushToken[a]",
        platform: "ios",
      },
    });
    const seen: PushMessage[] = [];
    setPushSender(async (m) => {
      seen.push(...m);
      return m.map(() => ({ ok: true }));
    });
    await sendReminders(at("2026-11-13T14:00:00Z"));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      to: "ExponentPushToken[a]",
      title: "Recordatorio de pago",
    });
    expect(seen[0].data).toMatchObject({ type: "PAYMENT_REMINDER" });
  });

  it("elimina push tokens inválidos", async () => {
    const { member } = await setupPayment({ dueDate: DUE });
    await prisma.pushToken.createMany({
      data: [
        { userId: member.id, token: "ExponentPushToken[bad]", platform: "ios" },
        {
          userId: member.id,
          token: "ExponentPushToken[good]",
          platform: "android",
        },
      ],
    });
    setPushSender(async (m) =>
      m.map((x) =>
        x.to.includes("bad") ? { ok: false, invalidToken: true } : { ok: true },
      ),
    );
    await sendReminders(at("2026-11-13T14:00:00Z"));
    expect((await prisma.pushToken.findMany()).map((t) => t.token)).toEqual([
      "ExponentPushToken[good]",
    ]);
  });

  it("un fallo de push no aborta el lote", async () => {
    const a = await setupPayment({ dueDate: DUE });
    await setupPayment({ dueDate: DUE });
    await prisma.pushToken.create({
      data: {
        userId: a.member.id,
        token: "ExponentPushToken[x]",
        platform: "ios",
      },
    });
    setPushSender(async () => {
      throw new Error("red caída");
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendReminders(at("2026-11-13T14:00:00Z"))).toBe(2);
  });
});
