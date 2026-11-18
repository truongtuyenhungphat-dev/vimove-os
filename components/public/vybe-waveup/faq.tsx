"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "cn";

const FAQ_ITEMS = [
  {
    q: "Vali bảo hành bao lâu?",
    a: "Vali được bảo hành chính hãng 24 tháng. Riêng phụ kiện gồm tay kéo, bánh xe và khóa số được bảo hành trọn đời.",
  },
  {
    q: "Giao hàng mất bao lâu? Có COD không?",
    a: "Giao nhanh 2–4 ngày toàn quốc, miễn phí vận chuyển cho đơn từ 500.000đ. Hỗ trợ thanh toán khi nhận hàng (COD) ở hầu hết khu vực — gọi hotline 0988 512 352 để xác nhận khu vực của bạn.",
  },
  {
    q: "Chính sách đổi trả như thế nào?",
    a: "Đổi trả trong 30 ngày nếu sản phẩm lỗi do nhà sản xuất. Liên hệ hotline hoặc Zalo để được hướng dẫn chi tiết.",
  },
  {
    q: "Nên chọn size 20 hay 24?",
    a: "Size 20″ phù hợp xách tay lên máy bay (cabin) cho chuyến đi ngắn 2–3 ngày. Size 24″ dung tích lớn hơn, phù hợp ký gửi cho chuyến đi dài hoặc đi theo nhóm.",
  },
  {
    q: "Màu nào cũng có sẵn cho cả 2 size?",
    a: "Tồn kho theo màu và size có thể thay đổi theo thời điểm. Nhắn Zalo hoặc gọi hotline để shop kiểm tra và giữ đúng màu bạn thích.",
  },
];

export function VybeWaveupFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl divide-y rounded-xl border">
      {FAQ_ITEMS.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            onClick={() => setOpen((o) => (o === i ? null : i))}
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-semibold"
            aria-expanded={open === i}
          >
            {item.q}
            <Plus className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-45")} aria-hidden="true" />
          </button>
          <div className={cn("grid transition-all", open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden">
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
