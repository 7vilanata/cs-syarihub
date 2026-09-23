import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "syarihub_cs_session";
const SESSION_SECONDS = 60 * 60 * 8;

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET minimal 32 karakter.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function validateCredentials(username: string, password: string) {
  const expectedUsername = process.env.DASHBOARD_USERNAME ?? "";
  const expectedPassword = process.env.DASHBOARD_PASSWORD ?? "";
  return Boolean(expectedUsername && expectedPassword) &&
    constantTimeEqual(username, expectedUsername) &&
    constantTimeEqual(password, expectedPassword);
}

export function createSessionValue(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !constantTimeEqual(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch { return false; }
}

export async function isAuthenticated() {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE_NAME)?.value);
}

export const sessionCookie = { name: COOKIE_NAME, maxAge: SESSION_SECONDS };

export function isValidBearer(authorization: string | null) {
  const token = process.env.N8N_INGEST_TOKEN ?? "";
  const received = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  return Boolean(token) && constantTimeEqual(received, token);
}
