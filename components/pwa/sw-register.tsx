"use client";

import { useEffect } from "react";

/**
 * Phase 10 — Scale: đăng ký Service Worker thật (public/sw.js) — không dùng lib PWA
 * nào, gọi thẳng `navigator.serviceWorker.register()`. Component rỗng (không render
 * gì), chỉ chạy side-effect 1 lần khi app mount. An toàn bỏ qua nếu trình duyệt
 * không hỗ trợ (`"serviceWorker" in navigator` false — Safari cũ, số ít trình duyệt).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Không đăng ký được Service Worker:", err);
    });
  }, []);

  return null;
}
