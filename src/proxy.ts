import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("ims_session")?.value);
  const publicPath = request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/reset-password") || request.nextUrl.pathname.startsWith("/api/auth");
  if (!hasSession && !publicPath) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
