import { describe, expect, it } from "vitest";
import { ingestSchema, resolveStatusAfterSync, statusSchema } from "./conversations";

const payload = {
  conversation_id: "928391",
  conversation_url: "https://omnichannel.example.com/conversations/928391",
  contact_name: "Aisyah",
  contact_phone: "+62 811 0000 1001",
  last_message_at: "2026-09-23T08:30:00.000Z",
  last_message_sender: "customer",
  summary: "Menanyakan cara pembayaran.",
  stage: "ready_to_pay",
  blocker: "payment_method",
  priority: "high",
  next_action: "Kirim metode pembayaran.",
  analyzed_at: "2026-09-23T08:32:00.000Z",
};

describe("validasi ingest", () => {
  it("menerima payload n8n yang valid", () => { expect(ingestSchema.safeParse(payload).success).toBe(true); });
  it("menolak enum dan field tambahan", () => {
    expect(ingestSchema.safeParse({ ...payload, priority: "critical" }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...payload, status: "converted" }).success).toBe(false);
  });
  it("menggunakan blocker none bila tidak dikirim", () => {
    const withoutBlocker = { ...payload, blocker: undefined };
    expect(ingestSchema.parse(withoutBlocker).blocker).toBe("none");
  });
});

describe("aturan sinkronisasi status", () => {
  const oldDate = new Date("2026-09-23T08:00:00Z");
  const newerDate = new Date("2026-09-23T09:00:00Z");
  it("mengembalikan actioned ke pending untuk pesan customer yang lebih baru", () => { expect(resolveStatusAfterSync("actioned", oldDate, newerDate, "customer")).toBe("pending"); });
  it("mempertahankan status final", () => {
    expect(resolveStatusAfterSync("converted", oldDate, newerDate, "customer")).toBe("converted");
    expect(resolveStatusAfterSync("closed", oldDate, newerDate, "customer")).toBe("closed");
    expect(resolveStatusAfterSync("not_a_lead", oldDate, newerDate, "customer")).toBe("not_a_lead");
  });
  it("mempertahankan actioned untuk pesan CS", () => { expect(resolveStatusAfterSync("actioned", oldDate, newerDate, "cs")).toBe("actioned"); });
});

describe("status manual", () => {
  it("hanya menerima status yang didukung", () => {
    expect(statusSchema.safeParse({ status: "converted" }).success).toBe(true);
    expect(statusSchema.safeParse({ status: "not_a_lead" }).success).toBe(true);
    expect(statusSchema.safeParse({ status: "paid" }).success).toBe(false);
  });
});
