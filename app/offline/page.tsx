import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Mất kết nối — VIMOVE OS" };

/**
 * Phase 10 — Scale: trang fallback thật khi Service Worker (public/sw.js) phát hiện
 * mất mạng lúc điều hướng — được cache sẵn từ lần đầu tiên truy cập (app shell
 * precache), nên hiện được ngay cả khi hoàn toàn không có kết nối tới server.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-medium">Không có kết nối mạng</p>
        <p className="mt-1 text-sm text-muted-foreground">
          VIMOVE OS cần kết nối Internet để tải dữ liệu mới nhất. Vui lòng kiểm tra mạng và thử lại.
        </p>
      </div>
    </div>
  );
}
