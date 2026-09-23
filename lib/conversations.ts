import { z } from "zod";
import {
  blockers, lastMessageSenders, priorities, stages, statuses,
  type Conversation, type ConversationStatus, type LastMessageSender,
} from "@/db/schema";
import { getDb } from "@/db";

const isoDateTime = z.string().datetime({ offset: true });

export const ingestSchema = z.object({
  conversation_id: z.string().trim().min(1).max(255),
  contact_name: z.string().trim().max(255).nullable().optional().default(null),
  contact_phone: z.string().trim().min(7).max(30).nullable().optional().default(null),
  last_message_at: isoDateTime,
  last_message_sender: z.enum(lastMessageSenders),
  summary: z.string().trim().min(1).max(5000),
  stage: z.enum(stages),
  blocker: z.enum(blockers).optional().default("none"),
  priority: z.enum(priorities),
  next_action: z.string().trim().min(1).max(5000),
  analyzed_at: isoDateTime,
}).strict();

export const statusSchema = z.object({ status: z.enum(statuses) }).strict();
export type IngestPayload = z.infer<typeof ingestSchema>;

export function resolveStatusAfterSync(currentStatus: ConversationStatus, oldDate: Date, newDate: Date, sender: LastMessageSender) {
  return currentStatus === "actioned" && sender === "customer" && newDate > oldDate
    ? "pending" : currentStatus;
}

export async function listConversations(): Promise<Conversation[]> {
  const sql = getDb();
  const rows = await sql<Conversation[]>`
    SELECT id, conversation_id, contact_name, contact_phone,
           last_message_at::text, last_message_sender, summary, stage, blocker,
           priority, next_action, status, analyzed_at::text
    FROM conversations
    ORDER BY CASE priority
      WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4
    END, last_message_at DESC
  `;
  return [...rows];
}

export async function upsertConversation(payload: IngestPayload) {
  const sql = getDb();
  const rows = await sql<{ inserted: boolean }[]>`
    INSERT INTO conversations (
      conversation_id, contact_name, contact_phone, last_message_at,
      last_message_sender, summary, stage, blocker, priority, next_action, analyzed_at
    ) VALUES (
      ${payload.conversation_id}, ${payload.contact_name}, ${payload.contact_phone},
      ${payload.last_message_at}, ${payload.last_message_sender}, ${payload.summary},
      ${payload.stage}, ${payload.blocker}, ${payload.priority}, ${payload.next_action}, ${payload.analyzed_at}
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
      contact_name = EXCLUDED.contact_name,
      contact_phone = EXCLUDED.contact_phone,
      last_message_at = EXCLUDED.last_message_at,
      last_message_sender = EXCLUDED.last_message_sender,
      summary = EXCLUDED.summary,
      stage = EXCLUDED.stage,
      blocker = EXCLUDED.blocker,
      priority = EXCLUDED.priority,
      next_action = EXCLUDED.next_action,
      analyzed_at = EXCLUDED.analyzed_at,
      status = CASE
        WHEN conversations.status = 'actioned'
          AND EXCLUDED.last_message_sender = 'customer'
          AND EXCLUDED.last_message_at > conversations.last_message_at
        THEN 'pending'::conversation_status ELSE conversations.status END
    RETURNING (xmax = 0) AS inserted
  `;
  return rows[0]?.inserted ? "created" : "updated";
}

export async function updateConversationStatus(id: string, status: ConversationStatus) {
  const sql = getDb();
  const rows = await sql<{ id: string; status: ConversationStatus }[]>`
    UPDATE conversations SET status = ${status}
    WHERE id = ${id} RETURNING id, status
  `;
  return rows[0] ?? null;
}
