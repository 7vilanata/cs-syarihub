import { afterEach, describe, expect, it, vi } from "vitest";
import { sendStatusWebhook } from "./status-webhook";
import type { StatusUpdate } from "./conversations";

const update: StatusUpdate = {
  id: "lead-1", conversation_id: "SYR-1001", conversation_url: "https://example.com/chat/1",
  contact_name: "Aisyah", contact_phone: "+628123456789",
  previous_status: "pending", status: "converted",
};

describe("webhook perubahan status", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("mengirim payload JSON dengan status asli dan label tampilan", async () => {
    vi.stubEnv("N8N_STATUS_WEBHOOK_URL", "https://n8n.example.com/webhook/status");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendStatusWebhook(update)).toBe("sent");
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://n8n.example.com/webhook/status");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toMatchObject({
      event: "conversation.status_changed", conversation_id: "SYR-1001",
      previous_status: "pending", previous_status_label: "Pending",
      status: "converted", status_label: "Deal",
    });
  });

  it("melewati pengiriman bila URL belum diatur", async () => {
    vi.stubEnv("N8N_STATUS_WEBHOOK_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendStatusWebhook(update)).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
