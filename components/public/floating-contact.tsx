"use client";

import { useSyncExternalStore } from "react";
import { Phone } from "lucide-react";
import { trackLeadEvent } from "@/components/public/lead-tracking";
import {
  getActiveProductContext,
  subscribeActiveProductContext,
  type ActiveProductContext,
} from "@/components/public/product-context";

function getServerSnapshot(): ActiveProductContext | null {
  return null;
}

/** Nút liên hệ nhanh nổi (Phase 16, tham chiếu bản Firebase cũ — `.floating-contact`
 * trong assets/css/style.css) — luôn hiện góc dưới-phải trên mọi trang công khai,
 * dẫn thẳng tới hotline thật và Zalo thật (cùng số 0988 512 352 dùng khắp site).
 * Không có giỏ hàng/checkout giả nên chỉ giữ lại 2 nút có đích đến thật.
 *
 * `bottom-24` (thay vì sát đáy màn hình) — cố tình chừa chỗ cho
 * `components/pwa/install-prompt.tsx` (Card cố định `bottom-4 ... z-50`, hiện sitewide
 * cho khách chưa cài/chưa đóng, kể cả trên các trang công khai này) đè lên, đã xác
 * minh thực tế qua ảnh chụp headless Chrome — 2 khối fixed cùng góc dưới-phải sẽ chồng
 * nhau nếu không nhường chỗ. Không sửa install-prompt.tsx vì nằm ngoài phạm vi việc.
 *
 * "use client" (mới) — 2 lý do: (1) bắn sự kiện Lead (Meta/TikTok/GA4, xem
 * lead-tracking.ts) khi bấm Zalo/gọi điện, vì đây là "chuyển đổi" thật của Vimove
 * (chốt đơn qua điện thoại/Zalo, không có checkout online); (2) khi khách đang ở
 * trang chi tiết sản phẩm, đọc tên sản phẩm từ sessionStorage (product-context.ts, do
 * product-cta-buttons.tsx ghi) để gắn vào link Zalo + payload sự kiện Lead — component
 * này nằm trong layout dùng chung nên không nhận được product qua props.
 *
 * useSyncExternalStore (thay vì state + effect) vì sessionStorage là nguồn dữ liệu
 * NGOÀI React — đây đúng là use case nó sinh ra để giải quyết, và tự re-render khi
 * product-cta-buttons.tsx set/clear context (qua notifyListeners trong
 * product-context.ts) mà không cần setState trong effect. */
export function FloatingContact() {
  const activeProduct = useSyncExternalStore(subscribeActiveProductContext, getActiveProductContext, getServerSnapshot);

  const leadContext = activeProduct
    ? { contentName: activeProduct.name, contentIds: [activeProduct.slug] }
    : undefined;

  // Zalo (zalo.me/<số>) không hỗ trợ tin nhắn soạn sẵn qua query string trên mọi
  // client, nên chỉ gắn tên sản phẩm vào fragment (#...) — không ảnh hưởng routing của
  // Zalo, phục vụ việc đối soát thủ công nếu sale xem lại link khách đã bấm.
  const zaloHref = activeProduct
    ? `https://zalo.me/0988512352#${encodeURIComponent(activeProduct.name)}`
    : "https://zalo.me/0988512352";

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2.5 sm:right-6">
      <a
        href={zaloHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackLeadEvent(leadContext)}
        className="flex h-11 items-center gap-2 rounded-full bg-[#0068ff] px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        <span className="text-[13px] font-extrabold tracking-tight">Zalo</span>
      </a>
      <a
        href="tel:0988512352"
        aria-label="Gọi hotline Vimove 0988 512 352"
        onClick={() => trackLeadEvent(leadContext)}
        className="relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" aria-hidden="true" />
        <Phone className="relative size-5" aria-hidden="true" />
      </a>
    </div>
  );
}
