export const lastMessageSenders = ["customer", "cs", "system"] as const;
export const stages = ["new", "interested", "considering", "ready_to_pay"] as const;
export const blockers = [
  "none", "price", "schedule", "payment_method", "needs_more_information",
  "needs_approval", "trust", "unresponsive", "other",
] as const;
export const priorities = ["urgent", "high", "medium", "low"] as const;
export const statuses = ["pending", "actioned", "converted", "closed", "not_a_lead"] as const;

export type LastMessageSender = (typeof lastMessageSenders)[number];
export type Stage = (typeof stages)[number];
export type Blocker = (typeof blockers)[number];
export type Priority = (typeof priorities)[number];
export type ConversationStatus = (typeof statuses)[number];

export type Conversation = {
  id: string;
  conversation_id: string;
  conversation_url: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message_at: string;
  last_message_sender: LastMessageSender;
  summary: string;
  stage: Stage;
  blocker: Blocker;
  priority: Priority;
  next_action: string;
  status: ConversationStatus;
  analyzed_at: string;
};
