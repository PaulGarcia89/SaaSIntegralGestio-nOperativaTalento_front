import { NextResponse } from "next/server";

const DEFAULT_PRODUCTION_API_URL = "https://saasintegralgestio-noperativatalentoback-production.up.railway.app/api";
const API_BASE_URL = (
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_API_URL : "/api")
).replace(/\/$/, "");
const SESSION_COOKIE = "talentos_frontend_session";
const SECURE_SESSION_COOKIE =
  process.env.SESSION_COOKIE_SECURE !== "false" &&
  process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const demoSession = process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true" && request.headers.get("x-demo-session") === "true";
  if (!demoSession) {
    if (!URL.canParse(API_BASE_URL)) {
      return NextResponse.json({ error: "API_URL_NOT_CONFIGURED" }, { status: 503 });
    }
    const verification = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!verification.ok) return NextResponse.json({ error: "INVALID_SESSION" }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, "verified", {
    httpOnly: true,
    secure: SECURE_SESSION_COOKIE,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
