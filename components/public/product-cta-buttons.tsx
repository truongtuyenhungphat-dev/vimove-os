"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackLeadEvent } from "@/components/public/lead-tracking";
import { setActiveProductContext, clearActiveProductContext } from "@/components/public/product-context";

/** CTA "Gọi đặt hàng" / "Liên hệ tư vấn" trên trang chi tiết sản phẩm — tách thành
 * Client Component riêng (thay vì cả page.tsx) vì chỉ phần này cần onClick để bắn sự
 * kiện Lead kèm tên/slug sản phẩm. Cũng mang sản phẩm đang xem qua 2 đường:
 *  - "Liên hệ tư vấn": query string ?product=&name= — trang /lien-he đọc để điền sẵn
 *    vào ô "Nội dung cần tư vấn" (xem lien-he/contact-form.tsx), sale không mất ngữ
 *    cảnh khi khách vào form.
 *  - Nút Zalo nổi sitewide (floating-contact.tsx): không phải con/cháu của page này
 *    nên không nhận props được — ghi tạm vào sessionStorage qua product-context.ts để
 *    nút Zalo đọc và gắn tên sản phẩm vào link + sự kiện Lead. */
export function ProductCtaButtons({ productSlug, productName }: { productSlug: string; productName: string }) {
  useEffect(() => {
    setActiveProductContext({ slug: productSlug, name: productName });
    return () => clearActiveProductContext();
  }, [productSlug, productName]);

  const contactHref = `/lien-he?product=${encodeURIComponent(productSlug)}&name=${encodeURIComponent(productName)}`;
  const leadContext = { contentName: productName, contentIds: [productSlug] };

  return (
    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
      <Button render={<a href="tel:0988512352" />} size="lg" onClick={() => trackLeadEvent(leadContext)}>
        <Phone className="size-4" aria-hidden="true" /> Gọi đặt hàng: 0988 512 352
      </Button>
      <Button render={<Link href={contactHref} />} size="lg" variant="outline" onClick={() => trackLeadEvent(leadContext)}>
        Liên hệ tư vấn
      </Button>
    </div>
  );
}
