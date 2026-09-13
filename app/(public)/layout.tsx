import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, UserRound } from "lucide-react";
import { listPublishedProductsGlobal } from "@/services/sales/products";

const CATEGORY_LABELS: Record<string, string> = { vali: "Vali kéo", balo: "Túi / Balo" };

const FOOTER_SUPPORT_LINKS = [
  { href: "/bao-hanh", label: "Bảo hành" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const products = await listPublishedProductsGlobal();
  const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo-horizontal.png" alt="Vimove" width={130} height={22} priority />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-primary">
              Trang chủ
            </Link>
            <div className="group relative">
              <Link href="/san-pham" className="hover:text-primary">
                Sản phẩm
              </Link>
              {categories.length > 0 && (
                <div className="invisible absolute top-full left-0 z-50 flex min-w-40 flex-col gap-0.5 rounded-lg border bg-popover p-1.5 opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100">
                  {categories.map((c) => (
                    <Link key={c} href={`/san-pham?cat=${c}`} className="rounded-md px-2.5 py-1.5 text-sm hover:bg-accent">
                      {CATEGORY_LABELS[c] ?? c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/bao-hanh" className="hover:text-primary">
              Bảo hành
            </Link>
            <Link href="/ve-chung-toi" className="hover:text-primary">
              Về chúng tôi
            </Link>
            <Link href="/lien-he" className="hover:text-primary">
              Liên hệ
            </Link>
          </nav>
          <Link
            href="/login"
            className="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <UserRound className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Đăng nhập nhân viên</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-neutral-950 text-neutral-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Image src="/logo-horizontal.png" alt="Vimove" width={130} height={22} className="brightness-0 invert" />
            <p className="max-w-sm text-sm leading-relaxed text-neutral-400">
              Công ty Cổ phần Thương mại Vimove Việt Nam — chuyên cung cấp vali, túi du lịch và phụ kiện hành lý chất
              lượng cao, giá cả hợp lý.
            </p>
            <div className="flex flex-col gap-2 text-sm text-neutral-400">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden="true" /> Tầng 5, Toà nhà Hoa Đăng, số 290 Nguyễn
                Trãi, P. Đại Mỗ, Hà Nội
              </span>
              <a href="tel:0988512352" className="flex items-center gap-2 hover:text-white">
                <Phone className="size-4 shrink-0" aria-hidden="true" /> 0988 512 352
              </a>
              <a href="mailto:info@vimove.com.vn" className="flex items-center gap-2 hover:text-white">
                <Mail className="size-4 shrink-0" aria-hidden="true" /> info@vimove.com.vn
              </a>
              <span className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" aria-hidden="true" /> 8:00 - 21:00 (Thứ 2 - Chủ nhật)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-white">Sản phẩm</h4>
            <div className="flex flex-col gap-2 text-sm text-neutral-400">
              {categories.length > 0 ? (
                categories.map((c) => (
                  <Link key={c} href={`/san-pham?cat=${c}`} className="hover:text-white">
                    {CATEGORY_LABELS[c] ?? c}
                  </Link>
                ))
              ) : (
                <Link href="/san-pham" className="hover:text-white">
                  Tất cả sản phẩm
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-white">Hỗ trợ</h4>
            <div className="flex flex-col gap-2 text-sm text-neutral-400">
              {FOOTER_SUPPORT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Vimove Việt Nam. MST: 0111462056.
        </div>
      </footer>
    </div>
  );
}
