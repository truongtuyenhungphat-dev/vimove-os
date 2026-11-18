"use client";

import { useEffect, useState } from "react";
import { Zap, Truck } from "lucide-react";

/** Đếm ngược tới hết ngày (giờ máy khách) — tự reset mỗi ngày, không bao giờ
 * hiển thị số âm hay giá trị "đã hết hạn" cũ như một số landing page copy. */
export function CountdownRibbon() {
  const [label, setLabel] = useState("--:--:--");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
      const m = String(Math.floor((diff / 60_000) % 60)).padStart(2, "0");
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      setLabel(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 bg-neutral-900 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <Zap className="size-3.5 shrink-0 text-yellow-400" aria-hidden="true" />
      <span>
        Ưu đãi hôm nay kết thúc sau <b className="tabular-nums">{label}</b>
      </span>
      <span className="hidden items-center gap-1 text-neutral-400 sm:flex">
        · <Truck className="size-3.5" aria-hidden="true" /> Freeship đơn từ 500K
      </span>
    </div>
  );
}
