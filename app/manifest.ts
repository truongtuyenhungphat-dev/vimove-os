import type { MetadataRoute } from "next";

/**
 * Phase 10 — Scale: Web App Manifest thật (Next.js file convention — xem
 * node_modules/next/dist/docs/.../manifest.md, KHÔNG dùng next-pwa hay lib PWA nào
 * để giữ đúng nguyên tắc "không thêm dependency nặng"). Icon giờ dùng đúng logo chính
 * thức VIMOVE (public/icon-192.png, public/icon-512.png — cắt từ file logo gốc
 * public/Vimove.png, xem NHAT-KY-KIEN-TRUC.md), không còn placeholder SVG chữ "V" tự
 * vẽ. `background_color` khớp nền sáng của theme v3 (trắng sang trọng, xem
 * app/globals.css) — trước đó để nền tối #0a0a0a gây nháy đen lúc splash screen do
 * lệch với app thật.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VIMOVE OS",
    short_name: "VIMOVE OS",
    description: "Business Operating System hợp nhất: Work, Process, Marketing, CRM/Sales, Analytics, AI.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#63aa04",
    lang: "vi",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
