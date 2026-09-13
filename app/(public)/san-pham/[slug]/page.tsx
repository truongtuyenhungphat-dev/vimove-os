import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, ChevronRight, ShieldCheck, Undo2, Truck, BadgeCheck } from "lucide-react";
import { getPublishedProductBySlugGlobal, listPublishedProductsGlobal } from "@/services/sales/products";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/public/product-card";

const CATEGORY_LABELS: Record<string, string> = { vali: "Vali kéo", balo: "Túi / Balo" };

const GUARANTEES = [
  { icon: ShieldCheck, title: "Bảo hành 24 tháng", desc: "Chính hãng toàn quốc" },
  { icon: Undo2, title: "Đổi trả 30 ngày", desc: "Lỗi nhà sản xuất" },
  { icon: Truck, title: "Miễn phí vận chuyển", desc: "Đơn từ 500.000đ" },
  { icon: BadgeCheck, title: "Hàng chính hãng 100%", desc: "Có tem, hoá đơn" },
];

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

// Description migrate từ Firestore sang Postgres bị lưu literal "\n" (2 ký tự
// backslash+n) thay vì ký tự xuống dòng thật — whitespace-pre-line vì vậy không
// tách dòng được, hiển thị nguyên chuỗi "\n" ra màn hình. Chuẩn hoá tại tầng
// hiển thị (không đụng dữ liệu DB) để không lộ lỗi hiển thị này ra site công khai.
function normalizeDescription(text: string) {
  return text.replace(/\\r\\n|\\n|\\r/g, "\n");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugGlobal(slug);
  return { title: product ? `${product.name} — Vimove` : "Không tìm thấy sản phẩm" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugGlobal(slug);
  if (!product) notFound();

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const related = (
    product.category
      ? await listPublishedProductsGlobal({ category: product.category })
      : await listPublishedProductsGlobal()
  ).filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href="/san-pham" className="hover:text-foreground">
          Sản phẩm
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {product.images[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.slice(1, 6).map((img) => (
                <div key={img} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <Image src={img} alt={product.name} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {product.category && (
            <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </span>
          )}
          <h1 className="text-2xl font-semibold">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-primary">{formatVnd(product.price)}</span>
            {discount && (
              <>
                <span className="text-muted-foreground line-through">{formatVnd(product.oldPrice!)}</span>
                <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-sm font-semibold text-destructive">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {product.material && (
            <p className="text-sm">
              <span className="text-muted-foreground">Chất liệu:</span> {product.material}
            </p>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Kích thước</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <span key={s} className="rounded-lg border px-3 py-1.5 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Màu sắc</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <span key={c} className="rounded-lg border px-3 py-1.5 text-sm">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button render={<a href="tel:0988512352" />} size="lg">
              <Phone className="size-4" aria-hidden="true" /> Gọi đặt hàng: 0988 512 352
            </Button>
            <Button render={<Link href="/lien-he" />} size="lg" variant="outline">
              Liên hệ tư vấn
            </Button>
          </div>

          {/* Cam kết bán hàng — chính sách thật của Vimove (bảo hành 24 tháng, đổi trả
           * 30 ngày, freeship 500K) đã công bố ở footer/trang bảo hành, lặp lại ngay
           * cạnh giá để tăng độ tin cậy tại đúng thời điểm ra quyết định mua. */}
          <div className="grid grid-cols-2 gap-2.5 border-t pt-5">
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

      <div className="mt-12">
        <Tabs defaultValue="desc">
          <TabsList>
            <TabsTrigger value="desc">Mô tả sản phẩm</TabsTrigger>
            <TabsTrigger value="specs">Thông tin chi tiết</TabsTrigger>
          </TabsList>
          <TabsContent value="desc" className="pt-4">
            {product.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {normalizeDescription(product.description)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Đang cập nhật mô tả sản phẩm.</p>
            )}
          </TabsContent>
          <TabsContent value="specs" className="pt-4">
            <dl className="divide-y rounded-xl border">
              <div className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">Thương hiệu</dt>
                <dd className="col-span-2 font-medium">Vimove</dd>
              </div>
              {product.material && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">Chất liệu</dt>
                  <dd className="col-span-2 font-medium">{product.material}</dd>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">Kích thước</dt>
                  <dd className="col-span-2 font-medium">{product.sizes.join(", ")}</dd>
                </div>
              )}
              {product.colors.length > 0 && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">Màu sắc</dt>
                  <dd className="col-span-2 font-medium">{product.colors.join(", ")}</dd>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">Bảo hành</dt>
                <dd className="col-span-2 font-medium">24 tháng chính hãng</dd>
              </div>
            </dl>
          </TabsContent>
        </Tabs>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 text-lg font-semibold">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
