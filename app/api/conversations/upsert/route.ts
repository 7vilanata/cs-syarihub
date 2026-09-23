import { NextResponse } from "next/server";
import { isValidBearer } from "@/lib/auth";
import { ingestSchema, upsertConversation } from "@/lib/conversations";

export async function POST(request: Request) {
  if (!isValidBearer(request.headers.get("authorization"))) {
    return NextResponse.json({ success: false, error: "Token ingest tidak valid." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: "Body harus berupa JSON valid." }, { status: 400 }); }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: "Payload tidak valid.",
      details: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    }, { status: 422 });
  }

  try {
    const action = await upsertConversation(parsed.data);
    return NextResponse.json({ success: true, action, conversation_id: parsed.data.conversation_id });
  } catch {
    return NextResponse.json({ success: false, error: "Database tidak dapat memproses request." }, { status: 500 });
  }
}
