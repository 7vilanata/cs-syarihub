import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";
import { isAuthenticated } from "@/lib/auth";
import { updateConversationStatus } from "@/lib/conversations";
import { sendStatusWebhook } from "@/lib/status-webhook";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn() }));
vi.mock("@/lib/conversations", () => ({
  statusSchema: { safeParse: (body: unknown) => ({ success: true, data: body }) },
  updateConversationStatus: vi.fn(),
}));
vi.mock("@/lib/status-webhook", () => ({ sendStatusWebhook: vi.fn() }));

const request = () => new Request("http://localhost/api/conversations/lead-1/status", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "converted" }),
});
const context = { params: Promise.resolve({ id: "lead-1" }) };
const update = {
  id: "lead-1", conversation_id: "SYR-1001", conversation_url: null,
  contact_name: "Aisyah", contact_phone: null,
  previous_status: "pending", status: "converted",
};

describe("PATCH status webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(updateConversationStatus).mockResolvedValue(update as Awaited<ReturnType<typeof updateConversationStatus>>);
    vi.mocked(sendStatusWebhook).mockResolvedValue("sent");
  });

  it("mengirim webhook setelah status berubah", async () => {
    const response = await PATCH(request(), context);
    expect(response.status).toBe(200);
    expect(sendStatusWebhook).toHaveBeenCalledExactlyOnceWith(update);
    expect(await response.json()).toMatchObject({ success: true, changed: true, webhook: "sent" });
  });

  it("tidak mengirim webhook bila status sama", async () => {
    vi.mocked(updateConversationStatus).mockResolvedValue({ ...update, previous_status: "converted" } as Awaited<ReturnType<typeof updateConversationStatus>>);
    const response = await PATCH(request(), context);
    expect(sendStatusWebhook).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ success: true, changed: false, webhook: null });
  });

  it("melaporkan kegagalan webhook tanpa membatalkan status tersimpan", async () => {
    vi.mocked(sendStatusWebhook).mockResolvedValue("failed");
    const response = await PATCH(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, changed: true, webhook: "failed" });
  });
});
