"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Ô tìm kiếm khách hàng — đọc/ghi qua query string `search`, cùng pattern với
 * components/work/task-filters.tsx: page (Server Component) đọc lại searchParams
 * để lọc dữ liệu thật qua listCustomers(organizationId, search). */
export function CustomerSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Tìm theo tên, email, SĐT..."
        defaultValue={searchParams.get("search") ?? ""}
        className="pl-8"
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
