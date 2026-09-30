import type { ConversationStatus } from "@/db/schema";

export const statusLabels: Record<ConversationStatus, string> = {
  pending: "Pending",
  actioned: "Ditindaklanjuti",
  converted: "Deal",
  closed: "Lost",
  not_a_lead: "Not a Lead",
};
