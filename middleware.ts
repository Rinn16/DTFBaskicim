import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages accessible without login
const publicPages = [
  "/", "/giris", "/kayit",
  "/tasarim",
  "/sepet", "/odeme", "/odeme/basarili", "/odeme/banka-havale",
  "/siparis-takip",
  "/gizlilik-politikasi",
  "/kullanim-sartlari",
  "/mesafeli-satis-sozlesmesi",
  "/iptal-ve-iade-politikasi",
  "/cerez-politikasi",
  "/iletisim",
  "/yardim",
  "/sifremi-unuttum",
  "/sifremi-sifirla",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes handle their own auth — skip middleware for all /api/*
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public pages
  if (publicPages.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Check JWT token for protected pages (edge-compatible, no Prisma needed)
  // NextAuth v5 uses __Secure- prefix on HTTPS and "authjs" salt
  const isSecure = request.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
    salt: cookieName,
  });
  const isLoggedIn = !!token;
  const isAdminPath = pathname.startsWith("/admin");

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/giris", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block non-admin users from admin paths
  if (isAdminPath && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
