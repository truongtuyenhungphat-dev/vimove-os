import type { Metadata } from "next";
import { Phone, Mail, Wrench } from "lucide-react";
import { listPublishedProductsGlobal } from "@/services/sales/products";
import { WarrantyTabs } from "./warranty-tabs";

export const metadata: Metadata = { title: "Bảo hành — Vimove" };

const INFO_CARDS = [
  { icon: Phone, title: "Hotline bảo hành", value: "0988 512 352", href: "tel:0988512352", hint: "8:00 – 21:00 mỗi ngày" },
  { icon: Mail, title: "Email hỗ trợ", value: "vimove8386@gmail.com", href: "mailto:vimove8386@gmail.com", hint: "Phản hồi trong 2–4 giờ" },
  { icon: Wrench, title: "Thời gian xử lý", value: "3 – 7 ngày", hint: "Tùy loại hư hỏng" },
];

export default async function WarrantyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const products = await listPublishedProductsGlobal();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Đăng Ký &amp; Tra Cứu Bảo Hành</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bảo hành chính hãng 24 tháng cho mọi sản phẩm Vimove</p>
      </div>

      <WarrantyTabs initialTab={tab ?? "policy"} products={products.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {INFO_CARDS.map(({ icon: Icon, title, value, href, hint }) => (
          <div key={title} className="rounded-xl border bg-card p-5 text-center">
            <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold">{title}</p>
            {href ? (
              <a href={href} className="text-base font-bold text-primary">
                {value}
              </a>
            ) : (
              <p className="text-base font-bold text-primary">{value}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
