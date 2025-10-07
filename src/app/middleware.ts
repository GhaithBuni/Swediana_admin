import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const isPublicPath = path === "/login";

  // Protected admin paths
  const isProtectedPath = path.startsWith("/dashboard");

  // For client-side auth with localStorage, we can't check token here
  // But we can redirect authenticated users away from login

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
