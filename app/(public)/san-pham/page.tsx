import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Phone } from "lucide-react";
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
  const countFor = (c: string | undefined) =>
    c ? allProducts.filter((p) => p.category === c).length : allProducts.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vali kéo, túi &amp; balo du lịch chính hãng Vimove</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar danh mục — tham chiếu bố cục 2 cột của bản Firebase cũ
         * (`.shop-layout`), nhưng chỉ liệt kê danh mục THẬT có trong DB thay vì
         * bộ lọc kích thước/màu/giá trang trí không nối dữ liệu như bản cũ. */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Danh mục</h2>
            <nav className="flex flex-col gap-0.5">
              <Link
                href="/san-pham"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                  !cat ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent"
                }`}
              >
                Tất cả
                <span className="text-xs text-muted-foreground">{countFor(undefined)}</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/san-pham?cat=${c}`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                    cat === c ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent"
                  }`}
                >
                  {CATEGORY_LABELS[c] ?? c}
                  <span className="text-xs text-muted-foreground">{countFor(c)}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-4 rounded-xl border bg-primary/5 p-4 text-center">
            <p className="text-sm font-semibold">Cần tư vấn chọn sản phẩm?</p>
            <p className="mt-1 text-xs text-muted-foreground">Gọi hotline để được hỗ trợ ngay</p>
            <a
              href="tel:0988512352"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <Phone className="size-3.5" aria-hidden="true" /> 0988 512 352
            </a>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 lg:hidden">
            <div className="flex flex-wrap gap-2">
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
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filtered.length}</strong> sản phẩm
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
              <PackageSearch className="size-10 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Không có sản phẩm nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
