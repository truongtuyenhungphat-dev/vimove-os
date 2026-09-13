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
// "/san-pham", "/ve-chung-toi", "/lien-he", "/bao-hanh" — website công khai
// Vimove.com.vn (Phase 16, di trú từ hệ thống Firebase cũ) — cùng lý do với
// "/lp": khách vãng lai xem không cần đăng nhập, và nhân viên đang đăng nhập
// vẫn xem được (không bị đẩy đi). "/bao-hanh" còn là đích redirect tương lai
// của domain vimove.net (in trên QR code sản phẩm, xem _redirects ở repo web
// cũ) — ?tab=register phải luôn mở công khai không qua đăng nhập.
const OPEN_PATHS = ["/lp", "/offline", "/san-pham", "/ve-chung-toi", "/lien-he", "/bao-hanh"];
// Trang chủ công khai — so sánh CHÍNH XÁC "/" (không dùng startsWith như các path
// khác ở trên) vì mọi pathname đều "bắt đầu bằng /", startsWith("/") sẽ vô tình mở
// công khai toàn bộ ứng dụng kể cả /dashboard, /work, ...
const OPEN_ROOT = "/";

// Domain vimove.net in trên QR code bảo hành của sản phẩm (không phải domain
// chính vimove.com.vn) — mọi request vào ĐÚNG root "/" của domain này phải
// nhảy thẳng sang cổng đăng ký bảo hành, giống hệt hành vi `_redirects` của
// site Firebase/Netlify cũ (`http(s)://vimove.net/ -> /chinh-sach-bao-hanh/
// ?tab=register 302!`) — chỉ đổi đích sang route Next.js tương ứng. Chỉ khớp
// CHÍNH XÁC "/", không phải toàn bộ domain, để các asset (_next/*, ảnh...)
// mà trang /bao-hanh cần vẫn tải được bình thường trên domain này, không bị
// redirect-loop (đúng lý do site cũ ghi rõ trong comment `_redirects`).
const WARRANTY_QR_HOSTS = ["vimove.net", "www.vimove.net"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  if (WARRANTY_QR_HOSTS.includes(host) && pathname === "/") {
    const url = new URL("/bao-hanh", req.nextUrl.origin);
    url.searchParams.set("tab", "register");
    return NextResponse.redirect(url);
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isOpenPath = pathname === OPEN_ROOT || OPEN_PATHS.some((path) => pathname.startsWith(path));

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
  // manifest.webmanifest + sw.js: PWA (Phase 10) — trình duyệt fetch 2 file này KHÔNG
  // kèm cookie/session trong nhiều tình huống (kiểm tra installability, hoặc lúc user
  // còn ở /login chưa đăng nhập, nơi ServiceWorkerRegister trong root layout đã chạy).
  // Thiếu dòng loại trừ này thì middleware chặn + redirect về HTML trang login, khiến
  // trình duyệt nhận nhầm Content-Type text/html thay vì JS/manifest thật — SW không
  // đăng ký được ngay từ lần ghé đầu tiên (phát hiện thật khi kiểm tra production).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
