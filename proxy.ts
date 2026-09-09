import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Middleware chạy trên Edge Runtime nên dùng NextAuth instance riêng dựng từ
// auth.config.ts (không có Prisma/Credentials) — xem ghi chú trong file đó.
const { auth } = NextAuth(authConfig);

// Trang auth (login/forgot-password): không cần đăng nhập để xem, NHƯNG bật lại thì
// bị đẩy về /dashboard (đã đăng nhập rồi thì không cần thấy form đăng nhập nữa).
const AUTH_PATHS = ["/login", "/forgot-password"];
// "/lp" — landing page công khai (Phase 5 Marketing): khách vãng lai xem/điền form
// không cần đăng nhập, và KHÔNG bị đẩy đi dù đang đăng nhập (staff cần xem/preview
// được trang của chính họ trong lúc vẫn đăng nhập ở tab khác — khác bản chất trang
// login/forgot-password).
// "/offline" — trang fallback của Service Worker (Phase 10 — Scale, xem
// public/sw.js) khi mất mạng: được cache tĩnh sẵn trong trình duyệt và trả về TRỰC
// TIẾP từ cache khi navigate lúc offline (server không hề chạy) — nhưng vẫn cần mở
// công khai để lần đầu precache (`cache.addAll` lúc SW install) không bị chặn.
const OPEN_PATHS = ["/lp", "/offline"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isOpenPath = OPEN_PATHS.some((path) => pathname.startsWith(path));

  if (isOpenPath) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isAuthPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
