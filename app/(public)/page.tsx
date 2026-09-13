import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Truck,
  Headset,
  ArrowRight,
  Phone,
  Luggage,
  Backpack,
  Lock,
  Undo2,
  Quote,
  Sparkles,
} from "lucide-react";
import { listPublishedProductsGlobal } from "@/services/sales/products";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vimove — Vali & Túi Du Lịch Chính Hãng",
  description: "Vali kéo, túi du lịch và phụ kiện hành lý chất lượng cao, giá cả hợp lý. Bảo hành 24 tháng, giao hàng toàn quốc.",
};

const USPS = [
  { icon: Truck, label: "Miễn phí ship từ 500K" },
  { icon: ShieldCheck, label: "Bảo hành chính hãng 24 tháng" },
  { icon: Undo2, label: "Đổi trả 30 ngày" },
  { icon: Lock, label: "Thanh toán an toàn" },
  { icon: Headset, label: "Hỗ trợ 24/7" },
];

const CATEGORY_SHOWCASE = [
  { cat: "vali", icon: Luggage, title: "Vali Kéo", desc: "Nhựa ABS / PP / PC bền bỉ" },
  { cat: "balo", icon: Backpack, title: "Túi & Balo Laptop", desc: "Chống sốc, chống thấm nước" },
];

const FEATURES = [
  { icon: Award, title: "Sản Phẩm Chính Hãng", desc: "100% sản phẩm có nguồn gốc rõ ràng, tem nhãn đầy đủ, không hàng giả hàng nhái." },
  { icon: ShieldCheck, title: "Bảo Hành 24 Tháng", desc: "Bảo hành chính hãng 24 tháng, hỗ trợ sửa chữa miễn phí." },
  { icon: Truck, title: "Giao Hàng Toàn Quốc", desc: "Giao nhanh 2–4 ngày toàn quốc. Miễn phí ship đơn từ 500.000đ." },
  { icon: Headset, title: "Hỗ Trợ 24/7", desc: "Đội ngũ tư vấn chuyên nghiệp, sẵn sàng hỗ trợ mọi lúc." },
];

// Cảm nhận khách hàng lấy nguyên văn từ trang chủ bản Firebase cũ (đã hiển thị công
// khai nhiều năm trên vimove.com.vn) — chỉ tên + tỉnh thành, không có SĐT/email/địa
// chỉ nên giữ nguyên mức độ công khai như bản gốc, không phát sinh rủi ro lộ PII mới.
const TESTIMONIALS = [
  {
    text: "Vali rất chắc chắn, bánh xe lăn êm, khóa kéo chắc. Mua về dùng cho chuyến du lịch Đà Nẵng, ai cũng khen đẹp. Sẽ tiếp tục ủng hộ Vimove!",
    name: "Trần Minh Tú",
    place: "Hà Nội",
  },
  {
    text: "Ship nhanh, đóng gói cẩn thận. Vali nhựa ABS rất cứng cáp, màu sắc đẹp như hình. Giá cả hợp lý, chất lượng vượt mong đợi.",
    name: "Lê Phương Anh",
    place: "TP. Hồ Chí Minh",
  },
  {
    text: "Mua bộ vali cho cả gia đình đi du lịch Phú Quốc. Chất lượng tốt, phục vụ nhiệt tình, tư vấn chu đáo. Nhân viên hỗ trợ rất nhanh. 5 sao!",
    name: "Nguyễn Thanh Hà",
    place: "Đà Nẵng",
  },
];

export default async function HomePage() {
  const products = await listPublishedProductsGlobal();
  const categoryCounts = new Map<string, number>();
  for (const p of products) {
    if (!p.category) continue;
    categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
  }

  return (
    <>
      <section className="relative">
        {/* banner-hero.jpg là 1 banner marketing đã hoàn chỉnh sẵn (có tiêu đề, badge,
         * CTA "Chọn vali phù hợp" bake thẳng vào ảnh) — không overlay thêm chữ đè lên
         * ảnh nữa vì sẽ tạo 2 tiêu đề chồng nhau rối mắt. Giữ đúng tỉ lệ gốc ảnh
         * (~2.5:1) qua mọi breakpoint thay vì kéo dọc 4:5 làm lộ phần crop xấu, và đưa
         * H1/CTA thật (cho SEO + hành động) xuống 1 dải caption sạch ngay bên dưới. */}
        <Link href="/san-pham" className="relative block aspect-[2/1] w-full overflow-hidden sm:aspect-[5/2]">
          <Image src="/banner-hero.jpg" alt="Vimove — Vali &amp; túi du lịch chính hãng" fill priority className="object-cover" />
        </Link>
        <div className="border-b bg-gradient-to-b from-card to-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-primary uppercase">
                <Sparkles className="size-3" aria-hidden="true" /> Vimove Original
              </span>
              <h1 className="mt-3 max-w-xl text-2xl leading-tight font-semibold sm:text-3xl">
                Vali &amp; Túi Du Lịch Chính Hãng
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Bền bỉ cho mọi hành trình — bảo hành chính hãng 24 tháng, giao hàng toàn quốc.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button render={<Link href="/san-pham" />} size="lg">
                Xem sản phẩm <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button render={<a href="tel:0988512352" />} size="lg" variant="outline">
                <Phone className="size-4" aria-hidden="true" /> 0988 512 352
              </Button>
            </div>
          </div>
        </div>

        {/* USP strip — tham chiếu `.usp-bar` bản cũ, rút gọn thành dải tĩnh dễ đọc
         * trên mọi kích thước màn hình thay vì marquee cuộn ngang. */}
        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 sm:justify-between">
            {USPS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold sm:text-2xl">Danh Mục Sản Phẩm</h2>
          <p className="mt-1 text-sm text-muted-foreground">Khám phá đa dạng các sản phẩm hành lý chất lượng cao</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CATEGORY_SHOWCASE.map(({ cat, icon: Icon, title, desc }) => (
            <Link
              key={cat}
              href={`/san-pham?cat=${cat}`}
              className="group flex items-center gap-5 rounded-2xl border bg-card p-6 transition hover:shadow-md"
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
                {categoryCounts.has(cat) && (
                  <p className="mt-1 text-xs text-primary">{categoryCounts.get(cat)} sản phẩm</p>
                )}
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Sản phẩm nổi bật</h2>
              <p className="mt-1 text-sm text-muted-foreground">Vali kéo, túi &amp; balo du lịch bán chạy nhất</p>
            </div>
            <Link href="/san-pham" className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Xem tất cả <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Đang cập nhật sản phẩm.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-10 text-center">
          <h2 className="text-xl font-semibold sm:text-2xl">Tại Sao Chọn Vimove?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chúng tôi cam kết mang lại trải nghiệm mua sắm tốt nhất cho bạn</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-semibold sm:text-2xl">Khách Hàng Nói Gì?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hàng nghìn khách hàng đã tin tưởng lựa chọn Vimove</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <Quote className="size-6 text-primary/40" aria-hidden="true" />
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2.5 border-t pt-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted-foreground">{t.place}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA đóng trang — panel tối "aurora" cùng ngôn ngữ thị giác với app/login
       * (hero-panel.tsx + keyframes trong globals.css), để trang công khai và hệ
       * thống nội bộ cảm giác cùng một sản phẩm thay vì hai gu thiết kế khác nhau. */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-16 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay bg-grain-overlay" />
        <div
          aria-hidden
          className="animate-login-aurora-a pointer-events-none absolute -top-24 -right-24 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="animate-login-aurora-b pointer-events-none absolute -bottom-32 -left-16 size-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.18 305), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-lg">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Cần tư vấn chọn vali phù hợp?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
            Đội ngũ Vimove sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp nhất với nhu cầu — gọi ngay hoặc để lại lời nhắn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/lien-he" />} size="lg">
              Liên hệ ngay
            </Button>
            <Button
              render={<a href="tel:0988512352" />}
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Phone className="size-4" aria-hidden="true" /> 0988 512 352
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
