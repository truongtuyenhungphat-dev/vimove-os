import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedProductsGlobal } from "@/services/sales/products";
import { ProductCard } from "@/components/public/product-card";

export const metadata: Metadata = { title: "Sản phẩm — Vimove" };

const CATEGORY_LABELS: Record<string, string> = { vali: "Vali kéo", balo: "Túi / Balo" };

export default async function ProductCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const [allProducts, filtered] = await Promise.all([
    listPublishedProductsGlobal(),
    listPublishedProductsGlobal({ category: cat }),
  ]);
  const categories = [...new Set(allProducts.map((p) => p.category).filter((c): c is string => !!c))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Sản phẩm</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vali kéo, túi & balo du lịch chính hãng Vimove</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/san-pham"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${!cat ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          Tất cả
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/san-pham?cat=${c}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${cat === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {CATEGORY_LABELS[c] ?? c}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Không có sản phẩm nào trong danh mục này.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
