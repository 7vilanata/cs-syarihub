import { NextResponse } from "next/server";
import { createSessionValue, sessionCookie, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  if (!validateCredentials(username, password)) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(sessionCookie.name, createSessionValue(username), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: sessionCookie.maxAge,
  });
  return response;
}
