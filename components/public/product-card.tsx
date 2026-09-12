import Image from "next/image";
import Link from "next/link";

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function ProductCard({
  product,
}: {
  product: { slug: string | null; name: string; price: number; oldPrice: number | null; images: string[] };
}) {
  if (!product.slug) return null;
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {discount && (
          <span className="absolute top-2 left-2 rounded-md bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-primary">{formatVnd(product.price)}</span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatVnd(product.oldPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
