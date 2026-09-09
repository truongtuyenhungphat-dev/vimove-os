"use client";

import { useState, useSyncExternalStore } from "react";
import { X, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DISMISS_KEY = "vimove-os-install-prompt-dismissed";
const subscribeNoop = () => () => {};

/**
 * Phase 10 — Scale: gợi ý cài đặt PWA — theo đúng khuyến nghị chính thức của Next.js
 * (node_modules/next/dist/docs/.../progressive-web-apps.md §6 "Adding to Home
 * Screen"): không tự bắt `beforeinstallprompt` (không cross-browser, không hoạt động
 * trên Safari iOS), chỉ hiện hướng dẫn — rõ ràng, không giả vờ có nút "Cài đặt" nào
 * tự động hoạt động trên mọi trình duyệt.
 *
 * `mounted` dùng useSyncExternalStore (snapshot server=false/client=true) — cùng kỹ
 * thuật với components/layout/theme-toggle.tsx — thay vì effect+setState, để không
 * vi phạm rule "set-state-in-effect" của React Compiler. isIOS/isStandalone/đã-đóng-
 * trước-đó chỉ là các lần ĐỌC API trình duyệt lúc render (sau khi mounted), không
 * cần lưu vào state vì không có gì phải "đồng bộ ngược" — chỉ setState thật khi user
 * bấm đóng (event handler, không phải effect).
 */
export function InstallPrompt() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  if (!mounted) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  let persistedDismissed = false;
  try {
    persistedDismissed = localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    persistedDismissed = false;
  }

  if (isStandalone || manuallyDismissed || persistedDismissed) return null;

  function dismiss() {
    setManuallyDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage có thể bị chặn (private mode) — bỏ qua, chỉ ẩn tạm cho phiên này.
    }
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm border-primary/20 shadow-lg sm:left-auto sm:right-4">
      <CardContent className="flex items-start gap-3 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Smartphone className="size-4" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium">Cài VIMOVE OS vào màn hình chính</p>
          {isIOS ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nhấn nút Chia sẻ trên Safari, sau đó chọn &quot;Thêm vào MH chính&quot;.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Mở menu trình duyệt và chọn &quot;Cài đặt ứng dụng&quot; hoặc &quot;Thêm vào màn hình chính&quot;.
            </p>
          )}
        </div>
        <button onClick={dismiss} aria-label="Đóng" className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}
