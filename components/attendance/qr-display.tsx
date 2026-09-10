"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";
import { QR_TOKEN_TTL_SECONDS } from "@/lib/attendance/types";

/**
 * Mã QR động thật — mỗi vòng lặp gọi Server Action sinh 1 token DB mới (xem
 * services/attendance/qr.ts), mã hiện tại hết hạn sau QR_TOKEN_TTL_SECONDS giây. Ảnh
 * chụp màn hình cũ sẽ bị `resolveQrToken` từ chối ngay khi hết hạn — không phải hiệu
 * ứng hình ảnh giả, token thật sự đổi trong DB mỗi lần.
 */
export function QrDisplay({
  locationId,
  generateToken,
}: {
  locationId: string;
  generateToken: (locationId: string) => Promise<{ token: string; expiresAt: string; locationName: string }>;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_TOKEN_TTL_SECONDS);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let refreshTimer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const { token, expiresAt } = await generateToken(locationId);
        if (!mounted.current) return;
        const url = `${window.location.origin}/attendance/qr/${token}`;
        const img = await QRCode.toDataURL(url, { width: 260, margin: 1 });
        if (!mounted.current) return;
        setDataUrl(img);
        const msLeft = new Date(expiresAt).getTime() - Date.now();
        setSecondsLeft(Math.max(0, Math.round(msLeft / 1000)));
        refreshTimer = setTimeout(refresh, Math.max(1000, msLeft));
      } catch {
        // im lặng thử lại sau vài giây nếu lỗi mạng tạm thời — không có gì để hiện lỗi hữu ích hơn
        refreshTimer = setTimeout(refresh, 5000);
      }
    }
    refresh();
    const countdownTimer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);

    return () => {
      mounted.current = false;
      clearTimeout(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [locationId, generateToken]);

  if (!dataUrl) {
    return (
      <div className="flex size-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, không phải asset tĩnh nên next/image không có lợi ích */}
      <img src={dataUrl} alt="Mã QR chấm công" width={260} height={260} className="rounded-lg border border-border" />
      <p className="text-xs text-muted-foreground">Mã đổi sau {secondsLeft}s — quét bằng camera điện thoại</p>
    </div>
  );
}
