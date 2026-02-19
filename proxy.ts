import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/", "/giris", "/kayit", "/api/auth",
  "/sepet", "/odeme", "/odeme/basarili", "/odeme/banka-havale",
  "/siparis-takip",
  "/api/payment/paytr/callback",
  "/api/orders/track",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdminPath = pathname.startsWith("/admin");

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/giris", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block non-admin users from admin paths
  if (isAdminPath && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
