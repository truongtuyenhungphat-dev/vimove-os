import { Phone } from "lucide-react";

/** Nút liên hệ nhanh nổi (Phase 16, tham chiếu bản Firebase cũ — `.floating-contact`
 * trong assets/css/style.css) — luôn hiện góc dưới-phải trên mọi trang công khai,
 * dẫn thẳng tới hotline thật và Zalo thật (cùng số 0988 512 352 dùng khắp site).
 * Không có giỏ hàng/checkout giả nên chỉ giữ lại 2 nút có đích đến thật.
 *
 * `bottom-24` (thay vì sát đáy màn hình) — cố tình chừa chỗ cho
 * `components/pwa/install-prompt.tsx` (Card cố định `bottom-4 ... z-50`, hiện sitewide
 * cho khách chưa cài/chưa đóng, kể cả trên các trang công khai này) đè lên, đã xác
 * minh thực tế qua ảnh chụp headless Chrome — 2 khối fixed cùng góc dưới-phải sẽ chồng
 * nhau nếu không nhường chỗ. Không sửa install-prompt.tsx vì nằm ngoài phạm vi việc. */
export function FloatingContact() {
  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2.5 sm:right-6">
      <a
        href="https://zalo.me/0988512352"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 items-center gap-2 rounded-full bg-[#0068ff] px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        <span className="text-[13px] font-extrabold tracking-tight">Zalo</span>
      </a>
      <a
        href="tel:0988512352"
        aria-label="Gọi hotline Vimove 0988 512 352"
        className="relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" aria-hidden="true" />
        <Phone className="relative size-5" aria-hidden="true" />
      </a>
    </div>
  );
}
