import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PRODUCTION_API_URL =
  "https://saasintegralgestio-noperativatalentoback-production.up.railway.app/api";
const API_BASE_URL = (
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_API_URL : "/api")
).replace(/\/$/, "");
const ALLOWED_ACTIONS = new Set(["login", "refresh", "logout", "me"]);
const AUTH_PROXY_TIMEOUT_MS = 15_000;

type RouteContext = {
  params: Promise<{ action: string }>;
};

async function proxyAuthRequest(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ message: "Ruta de autenticación no disponible." }, { status: 404 });
  }

  const headers = new Headers();
  if (request.method !== "GET") headers.set("Content-Type", "application/json");
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);

  const body = request.method === "GET" ? undefined : await request.text();

  try {
    const upstream = await fetch(`${API_BASE_URL}/auth/${action}`, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_PROXY_TIMEOUT_MS),
    });
    const responseBody = await upstream.text();
    const response = new NextResponse(responseBody || null, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });

    const setCookies =
      typeof upstream.headers.getSetCookie === "function"
        ? upstream.headers.getSetCookie()
        : upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : [];
    for (const setCookie of setCookies) {
      response.headers.append("Set-Cookie", setCookie);
    }
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) response.headers.set("x-request-id", requestId);

    return response;
  } catch {
    return NextResponse.json(
      {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "El servicio de autenticación no está disponible. Inténtalo nuevamente.",
      },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyAuthRequest(request, context);
}
