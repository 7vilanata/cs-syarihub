import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/login" } });
  response.cookies.set(sessionCookie.name, "", { path: "/", maxAge: 0 });
  return response;
}
