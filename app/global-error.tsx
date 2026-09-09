"use client";

import { useEffect } from "react";
import { reportClientErrorAction } from "@/lib/observability/report-client-error";

/**
 * Phase 10 — Scale: bắt lỗi ở tầng NGOÀI CÙNG (root layout/error nằm ngoài mọi
 * Provider) — Next.js yêu cầu file này tự định nghĩa <html>/<body> riêng, không dùng
 * lại app/layout.tsx vì chính layout đó có thể là nguyên nhân lỗi. Ghi log qua cùng
 * Server Action với app/(protected)/error.tsx.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    reportClientErrorAction(error.message, error.stack ?? null, typeof window !== "undefined" ? window.location.pathname : "").catch(() => {});
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 600, fontSize: "1rem" }}>Đã có lỗi nghiêm trọng xảy ra</p>
          <p style={{ marginTop: 4, fontSize: "0.875rem", color: "#666" }}>
            {error.digest ? `Mã lỗi: ${error.digest}` : "Vui lòng tải lại trang."}
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid #ccc", background: "white", cursor: "pointer" }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
