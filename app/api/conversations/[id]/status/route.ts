import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { statusSchema, updateConversationStatus } from "@/lib/conversations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Status tidak valid." }, { status: 422 });
  }
  const { id } = await context.params;
  try {
    const updated = await updateConversationStatus(id, parsed.data.status);
    if (!updated) return NextResponse.json({ success: false, error: "Conversation tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, conversation: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Status gagal disimpan." }, { status: 500 });
  }
}
