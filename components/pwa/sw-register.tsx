"use client";

import { useEffect } from "react";

/**
 * Phase 10 — Scale: đăng ký Service Worker thật (public/sw.js) — không dùng lib PWA
 * nào, gọi thẳng `navigator.serviceWorker.register()`. Component rỗng (không render
 * gì), chỉ chạy side-effect 1 lần khi app mount. An toàn bỏ qua nếu trình duyệt
 * không hỗ trợ (`"serviceWorker" in navigator` false — Safari cũ, số ít trình duyệt).
 *
 * KHÔNG đăng ký ở dev local (`NODE_ENV === "development"`) — cache-first của SW cho
 * `/_next/static/*` từng khiến CSS/JS mới bị che mất suốt nhiều lượt sửa code +
 * restart dev server (xem NHAT-KY-KIEN-TRUC.md §5 mục 6). Production/preview build
 * (`next build && next start`, hoặc Vercel) không bị ảnh hưởng.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Không đăng ký được Service Worker:", err);
    });
  }, []);

  return null;
}
