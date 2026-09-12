import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, ChevronRight } from "lucide-react";
import { getPublishedProductBySlugGlobal } from "@/services/sales/products";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS: Record<string, string> = { vali: "Vali kéo", balo: "Túi / Balo" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/san-pham" className="hover:text-foreground">
          Sản phẩm
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="text-foreground">{product.name}</span>
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

          {product.description && (
            <div className="border-t pt-5">
              <p className="mb-2 text-sm font-medium">Mô tả sản phẩm</p>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
