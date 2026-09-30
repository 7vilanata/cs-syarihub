import type { StatusUpdate } from "@/lib/conversations";
import { statusLabels } from "@/lib/status-labels";

export type WebhookResult = "sent" | "not_configured" | "failed";

export async function sendStatusWebhook(update: StatusUpdate): Promise<WebhookResult> {
  const url = process.env.N8N_STATUS_WEBHOOK_URL;
  if (!url) return "not_configured";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "conversation.status_changed",
        occurred_at: new Date().toISOString(),
        id: update.id,
        conversation_id: update.conversation_id,
        conversation_url: update.conversation_url,
        contact_name: update.contact_name,
        contact_phone: update.contact_phone,
        previous_status: update.previous_status,
        previous_status_label: statusLabels[update.previous_status],
        status: update.status,
        status_label: statusLabels[update.status],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return "sent";
  } catch (error) {
    console.error("Gagal mengirim webhook perubahan status ke n8n:", error);
    return "failed";
  }
}
