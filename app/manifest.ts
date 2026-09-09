import type { MetadataRoute } from "next";

/**
 * Phase 10 — Scale: Web App Manifest thật (Next.js file convention — xem
 * node_modules/next/dist/docs/.../manifest.md, KHÔNG dùng next-pwa hay lib PWA nào
 * để giữ đúng nguyên tắc "không thêm dependency nặng"). Chỉ có `icon.svg` (chưa có
 * icon PNG thiết kế riêng) — SVG với `purpose: "any"` được Chrome/Edge chấp nhận cho
 * tiêu chí installability, nhưng iOS Safari "Thêm vào màn hình chính" thường cần
 * thêm 1 PNG riêng qua `apple-touch-icon` — xem việc còn lại trong docs/10-scale.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VIMOVE OS",
    short_name: "VIMOVE OS",
    description: "Business Operating System hợp nhất: Work, Process, Marketing, CRM/Sales, Analytics, AI.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#4338ca",
    lang: "vi",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
