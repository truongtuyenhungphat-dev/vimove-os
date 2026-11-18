import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { LeadLink } from "@/components/public/lead-link";

/** Header/footer RIÊNG cho landing page ads này — cố tình KHÔNG dùng chung
 * app/(public)/layout.tsx: một ladipage chạy ads không được có link điều
 * hướng (Trang chủ/Sản phẩm/...) khiến khách rời trang trước khi đặt đơn —
 * nguyên tắc landing page cơ bản. Chỉ giữ logo (không phải link) + hotline. */
export function VybeWaveupHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Image src="/logo-horizontal.png" alt="Vimove" width={120} height={20} priority />
        <LeadLink
          href="tel:0988512352"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Phone className="size-4" aria-hidden="true" /> 0988 512 352
        </LeadLink>
      </div>
    </header>
  );
}

export function VybeWaveupFooter() {
  return (
    <footer className="border-t bg-neutral-950 text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Image src="/logo-horizontal.png" alt="Vimove" width={120} height={20} className="brightness-0 invert" />
          <p className="max-w-sm text-sm text-neutral-400">
            Vybe by Travelking là dòng vali, túi du lịch của Công ty Cổ phần Thương mại Vimove Việt Nam — chất lượng
            cao, giá cả hợp lý, chính hãng toàn quốc.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-neutral-400">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" /> Tầng 5, Toà nhà Hoa Đăng, 290 Nguyễn Trãi, P.
            Đại Mỗ, Hà Nội
          </span>
          <LeadLink href="tel:0988512352" className="flex items-center gap-2 hover:text-white">
            <Phone className="size-4 shrink-0" aria-hidden="true" /> 0988 512 352
          </LeadLink>
          <a href="mailto:info@vimove.com.vn" className="flex items-center gap-2 hover:text-white">
            <Mail className="size-4 shrink-0" aria-hidden="true" /> info@vimove.com.vn
          </a>
          <span className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden="true" /> 8:00 - 21:00 (Thứ 2 - Chủ nhật)
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Công ty CP TM Vimove Việt Nam. MST: 0111462056 — Cấp ngày 14/04/2026, Chi cục
        Thuế cơ sở 8 TP Hà Nội quản lý.
      </div>
    </footer>
  );
}
