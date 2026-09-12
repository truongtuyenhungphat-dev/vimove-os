import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, ShieldCheck, Truck, Headset, ArrowRight } from "lucide-react";
import { listPublishedProductsGlobal } from "@/services/sales/products";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vimove — Vali & Túi Du Lịch Chính Hãng",
  description: "Vali kéo, túi du lịch và phụ kiện hành lý chất lượng cao, giá cả hợp lý. Bảo hành 24 tháng, giao hàng toàn quốc.",
};

const FEATURES = [
  { icon: Award, title: "Sản Phẩm Chính Hãng", desc: "100% sản phẩm có nguồn gốc rõ ràng, tem nhãn đầy đủ, không hàng giả hàng nhái." },
  { icon: ShieldCheck, title: "Bảo Hành 24 Tháng", desc: "Bảo hành chính hãng 24 tháng, hỗ trợ sửa chữa miễn phí." },
  { icon: Truck, title: "Giao Hàng Toàn Quốc", desc: "Giao nhanh 2–4 ngày toàn quốc. Miễn phí ship đơn từ 500.000đ." },
  { icon: Headset, title: "Hỗ Trợ 24/7", desc: "Đội ngũ tư vấn chuyên nghiệp, sẵn sàng hỗ trợ mọi lúc." },
];

export default async function HomePage() {
  const products = await listPublishedProductsGlobal();

  return (
    <>
      <section className="relative">
        <div className="relative aspect-[21/9] w-full overflow-hidden sm:aspect-[3/1]">
          <Image src="/banner-hero.jpg" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-start justify-end gap-3 p-6 sm:p-10">
            <h1 className="max-w-lg text-2xl font-semibold text-white sm:text-4xl">
              Vali &amp; Túi Du Lịch Chính Hãng
            </h1>
            <p className="max-w-md text-sm text-white/85 sm:text-base">
              Bền bỉ cho mọi hành trình — bảo hành 24 tháng, giao hàng toàn quốc.
            </p>
            <Button render={<Link href="/san-pham" />} size="lg">
              Xem sản phẩm <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Sản phẩm nổi bật</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vali kéo, túi & balo du lịch bán chạy nhất</p>
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
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">Cần tư vấn chọn vali phù hợp?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Đội ngũ Vimove sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp nhất với nhu cầu.
        </p>
        <Button render={<Link href="/lien-he" />} className="mt-5" size="lg" variant="outline">
          Liên hệ ngay
        </Button>
      </section>
    </>
  );
}
