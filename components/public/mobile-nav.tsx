"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Home, Package, ShieldCheck, Building2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/san-pham", label: "Sản phẩm", icon: Package },
  { href: "/chinh-sach-bao-hanh", label: "Bảo hành", icon: ShieldCheck },
  { href: "/ve-chung-toi", label: "Về chúng tôi", icon: Building2 },
  { href: "/lien-he", label: "Liên hệ", icon: Phone },
];

/** Menu điều hướng công khai (Phase 16) trên mobile — bản desktop dùng nav
 * ngang ẩn dưới `md:`, nhưng trước bản này mobile hoàn toàn KHÔNG có cách nào
 * điều hướng giữa Trang chủ/Sản phẩm/Bảo hành/Về chúng tôi/Liên hệ ngoài kéo
 * xuống chân trang — một lỗ hổng điều hướng thật trên ~400px, không chỉ là
 * vấn đề thẩm mỹ. Dùng Sheet (base-ui Dialog) có sẵn thay vì tự dựng overlay. */
export function MobileNav({ categoryLinks }: { categoryLinks: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Mở menu điều hướng"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      <SheetContent side="right" className="w-3/4 gap-0 p-0 sm:max-w-xs">
        <SheetHeader className="border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <SheetClose
              key={href}
              render={
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                />
              }
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </SheetClose>
          ))}
        </nav>
        {categoryLinks.length > 0 && (
          <div className="border-t p-3">
            <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Danh mục
            </p>
            <div className="flex flex-col gap-1">
              {categoryLinks.map((c) => (
                <SheetClose
                  key={c.href}
                  render={<Link href={c.href} className="rounded-lg px-3 py-2 text-sm hover:bg-accent" />}
                >
                  {c.label}
                </SheetClose>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto border-t p-4">
          <a href="tel:0988512352" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Phone className="size-4" aria-hidden="true" /> 0988 512 352
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
