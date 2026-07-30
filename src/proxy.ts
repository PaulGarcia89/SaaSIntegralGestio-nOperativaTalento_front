import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/profile", "/employees", "/notifications", "/reports", "/ats", "/onboarding", "/training", "/productivity", "/inventory", "/admin"];

export function proxy(request: NextRequest) {
  const protectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  if (!protectedRoute) return NextResponse.next();
  if (request.cookies.get("talentos_frontend_session")?.value === "verified") return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
