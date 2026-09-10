// Phase 10 — Scale: Service Worker thật, viết tay (không dùng next-pwa/Serwist — giữ
// đúng nguyên tắc "không thêm dependency nặng" đã áp dụng xuyên suốt dự án). Chiến
// lược: cache-first cho static asset (JS/CSS/ảnh Next.js build ra, bất biến theo
// build id nên cache dài hạn an toàn), network-first cho điều hướng trang (luôn ưu
// tiên bản mới nhất khi có mạng, chỉ dùng cache/offline fallback khi mất mạng).
//
// CACHE_NAME đổi theo mỗi lần sửa file này — buộc trình duyệt coi là service worker
// mới, kích hoạt `activate` dọn cache cũ (không để cache stale tồn tại vĩnh viễn).
const CACHE_NAME = "vimove-os-shell-v2";
const OFFLINE_URL = "/offline";
const APP_SHELL = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // Không cache Server Action POST/mutation.

  // Điều hướng trang (navigation): network-first, fallback trang /offline thật khi
  // mất mạng — KHÔNG serve trang cũ đã cache (dữ liệu RBAC/dashboard đổi liên tục,
  // serve nhầm bản cache cũ nguy hiểm hơn là không có gì).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error()))
    );
    return;
  }

  // Static asset Next.js (JS/CSS/font build ra kèm hash bất biến) + icon: cache-first.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
      )
    );
  }
  // Mọi request khác (API, RSC payload...) đi thẳng mạng, không can thiệp.
});
