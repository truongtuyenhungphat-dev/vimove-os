import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShieldCheck, Undo2, Truck, BadgeCheck, Package, GlassWater, Lock, RefreshCw, Palette, Sparkles } from "lucide-react";
import { getPublishedProductBySlugGlobal } from "@/services/sales/products";
import { ProductOrderPanel } from "@/components/public/product-order-panel";
import { ProductCtaButtons } from "@/components/public/product-cta-buttons";
import { AnalyticsPixels } from "@/components/public/analytics-pixels";
import { FloatingContact } from "@/components/public/floating-contact";
import { CountdownRibbon } from "@/components/public/vybe-waveup/countdown-ribbon";
import { VybeWaveupGallery } from "@/components/public/vybe-waveup/gallery";
import { VybeWaveupFaq } from "@/components/public/vybe-waveup/faq";
import { VybeWaveupHeader, VybeWaveupFooter } from "@/components/public/vybe-waveup/minimal-shell";

const SLUG = "vali-keo-vybe-waveup-vb-68";

const GUARANTEES = [
  { icon: ShieldCheck, title: "Bảo hành 24 tháng", desc: "Chính hãng toàn quốc" },
  { icon: Undo2, title: "Đổi trả 30 ngày", desc: "Lỗi nhà sản xuất" },
  { icon: Truck, title: "Miễn phí vận chuyển", desc: "Đơn từ 500.000đ" },
  { icon: BadgeCheck, title: "Hàng chính hãng 100%", desc: "Có tem, hoá đơn" },
];

const USPS = [
  { icon: Package, title: "Nhựa ABS chống trầy", desc: "Bề mặt vân nhám hạn chế xước khi va đập, giữ vali mới lâu hơn qua nhiều chuyến đi." },
  { icon: GlassWater, title: "Khay đựng cốc tiện lợi", desc: "Để trà sữa, cà phê gọn gàng khi chờ sân bay hoặc ga tàu, không lo đổ tràn." },
  { icon: Lock, title: "Khóa kép chống rạch", desc: "Bảo vệ hành lý ở nơi đông người, khóa số 3 chữ số âm chìm hạn chế va quẹt vỡ khóa." },
  { icon: RefreshCw, title: "Bánh xe kép 360°", desc: "Bọc cao su giảm chấn, xoay êm trên mọi mặt sàn — kéo nhẹ tay cả khi vali đầy đồ." },
  { icon: Palette, title: "6 màu hot trend", desc: "Từ pastel nhẹ nhàng đến tông đậm cá tính — dễ phối cho mọi gu thời trang." },
  { icon: Sparkles, title: "Phụ kiện bảo hành trọn đời", desc: "Tay kéo, bánh xe, khóa số được bảo hành trọn đời — an tâm dùng lâu dài." },
];

// Thứ tự khớp với product.colors thật trong DB (Xanh lily, Xanh nhạt, Đen, Xám
// rêu, Cam đào, Tím) để nhất quán với các nút chọn màu trong ProductOrderPanel.
const COLOUR_SHOTS = [
  { file: "vybe-waveup-vb68-color-xanh-lily.jpg", name: "Xanh lily" },
  { file: "vybe-waveup-vb68-color-xanh-nhat.jpg", name: "Xanh nhạt" },
  { file: "vybe-waveup-vb68-color-den.jpg", name: "Đen" },
  { file: "vybe-waveup-vb68-color-xam-reu.jpg", name: "Xám rêu" },
  { file: "vybe-waveup-vb68-color-cam-dao.jpg", name: "Cam đào" },
  { file: "vybe-waveup-vb68-color-tim.jpg", name: "Tím" },
];

const TESTIMONIALS = [
  {
    quote:
      "Vali rất chắc chắn, bánh xe lăn êm, khóa kéo chắc. Mua về dùng cho chuyến du lịch Đà Nẵng, ai cũng khen đẹp. Sẽ tiếp tục ủng hộ Vimove!",
    name: "Trần Minh Tú",
    place: "Hà Nội",
  },
  {
    quote: "Ship nhanh, đóng gói cẩn thận. Vali nhựa ABS rất cứng cáp, màu sắc đẹp như hình. Giá cả hợp lý, chất lượng vượt mong đợi.",
    name: "Lê Phương Anh",
    place: "TP. Hồ Chí Minh",
  },
  {
    quote: "Mua bộ vali cho cả gia đình đi du lịch Phú Quốc. Chất lượng tốt, phục vụ nhiệt tình, tư vấn chu đáo. Nhân viên hỗ trợ rất nhanh. 5 sao!",
    name: "Nguyễn Thanh Hà",
    place: "Đà Nẵng",
  },
];

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export async function generateMetadata(): Promise<Metadata> {
  const product = await getPublishedProductBySlugGlobal(SLUG);
  return { title: product ? `${product.name} — Vimove` : "Không tìm thấy sản phẩm" };
}

export default async function VybeWaveupLandingPage() {
  const product = await getPublishedProductBySlugGlobal(SLUG);
  if (!product) notFound();

  const discount = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  const galleryImages = [
    ...product.images.map((src) => ({ src, alt: product.name })),
    ...COLOUR_SHOTS.map((c) => ({ src: `/products/${c.file}`, alt: `Vybe Waveup VB-68 màu ${c.name}` })),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <AnalyticsPixels />
      <VybeWaveupHeader />
      <CountdownRibbon />

      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* HERO */}
        <div className="grid gap-10 lg:grid-cols-2">
          <VybeWaveupGallery images={galleryImages} productName={product.name} />

          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="size-3.5" aria-hidden="true" /> Vybe by Travelking · Hàng chính hãng
            </span>
            <h1 className="text-2xl font-semibold sm:text-3xl">{product.name}</h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-primary">{formatVnd(product.price)}</span>
              {discount && (
                <>
                  <span className="text-muted-foreground line-through">{formatVnd(product.oldPrice!)}</span>
                  <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-sm font-semibold text-destructive">-{discount}%</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Giá áp dụng cho 1 vali · đã gồm khay đựng cốc &amp; khóa số chống rạch</p>

            <ProductOrderPanel productId={product.id} productName={product.name} productSlug={SLUG} sizes={product.sizes} colors={product.colors} />

            <ProductCtaButtons productSlug={SLUG} productName={product.name} />

            <div className="grid grid-cols-2 gap-2.5 border-t pt-5 sm:grid-cols-4">
              {GUARANTEES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-2.5 rounded-lg bg-primary/5 p-2.5">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="text-xs leading-tight">
                    <p className="font-semibold">{title}</p>
                    <p className="text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* USP */}
        <div className="mt-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Vì sao chọn Waveup VB-68</p>
            <h2 className="mt-1 text-2xl font-semibold">Thiết kế cho người trẻ hay di chuyển</h2>
            <p className="mt-2 text-sm text-muted-foreground">Bền với va đập, tiện cho ngày dài di chuyển — không chỉ đẹp trong ảnh.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USPS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-muted/30 p-5">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SPECS */}
        <div className="mt-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Thông số</p>
            <h2 className="mt-1 text-2xl font-semibold">Thông tin chi tiết sản phẩm</h2>
          </div>
          <dl className="mx-auto grid max-w-3xl divide-y rounded-xl border sm:grid-cols-2 sm:divide-x sm:divide-y-0 [&>div]:grid [&>div]:grid-cols-2 [&>div]:gap-4 [&>div]:px-5 [&>div]:py-3 [&>div]:text-sm">
            <div>
              <dt className="text-muted-foreground">Thương hiệu</dt>
              <dd className="font-medium">Vybe by Travelking</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mã sản phẩm</dt>
              <dd className="font-medium">Waveup VB-68</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Chất liệu</dt>
              <dd className="font-medium">{product.material || "Nhựa ABS cứng cáp, bề mặt vân nhám chống trầy"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kích thước</dt>
              <dd className="font-medium">{product.sizes.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Khóa</dt>
              <dd className="font-medium">Khóa số 3 chữ số âm chìm + khóa kép chống rạch</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bánh xe</dt>
              <dd className="font-medium">4 bánh kép xoay 360°, bọc cao su giảm chấn</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Màu sắc</dt>
              <dd className="font-medium">{product.colors.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bảo hành</dt>
              <dd className="font-medium">24 tháng chính hãng · phụ kiện trọn đời</dd>
            </div>
          </dl>
        </div>

        {/* COLOUR SHOWCASE */}
        <div className="mt-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Bảng màu</p>
            <h2 className="mt-1 text-2xl font-semibold">6 màu hot trend, chọn đúng gu của bạn</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {COLOUR_SHOTS.map((c) => (
              <figure key={c.file} className="flex flex-col items-center gap-2">
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border bg-muted">
                  <Image src={`/products/${c.file}`} alt={`Vybe Waveup VB-68 màu ${c.name}`} fill sizes="160px" className="object-cover" />
                </div>
                <figcaption className="text-xs font-medium text-muted-foreground">{c.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* LIFESTYLE + FEATURES */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            <Image src="/products/vybe-waveup-vb68-2.jpg" alt="Trải nghiệm thực tế vali Vybe Waveup VB-68" fill sizes="(min-width:640px) 48vw, 100vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            <Image
              src="/products/vybe-waveup-vb68-features.jpg"
              alt="4 tính năng nổi bật Vybe Waveup VB-68: dây khóa chống rạch, khay đựng ly, móc treo đồ, khóa số bảo mật"
              fill
              sizes="(min-width:640px) 48vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="mt-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Khách hàng nói gì</p>
            <h2 className="mt-1 text-2xl font-semibold">Hàng nghìn khách hàng đã tin chọn Vybe</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border bg-muted/30 p-5">
                <p className="mb-3 text-amber-500">★★★★★</p>
                <p className="mb-4 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {t.name[0]}
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

        {/* FAQ */}
        <div className="mt-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Giải đáp</p>
            <h2 className="mt-1 text-2xl font-semibold">Câu hỏi thường gặp</h2>
          </div>
          <VybeWaveupFaq />
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-16 rounded-2xl border bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-semibold">Sẵn sàng cho chuyến đi tiếp theo?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Đặt ngay hôm nay — đội ngũ Vimove gọi xác nhận trước khi giao, chưa cần thanh toán trước.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <ProductCtaButtons productSlug={SLUG} productName={product.name} />
          </div>
        </div>
      </div>

      <VybeWaveupFooter />
      <FloatingContact />
    </div>
  );
}
