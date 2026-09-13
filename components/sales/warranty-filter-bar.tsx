"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WARRANTY_STATUSES, WARRANTY_STATUS_LABELS } from "@/lib/warranty/types";

/** Tìm kiếm + lọc trạng thái bảo hành — cùng pattern với components/work/task-filters.tsx:
 * đọc/ghi query string, page (Server Component) đọc lại để lọc qua listWarranties(). */
export function WarrantyFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo mã, sản phẩm, khách hàng..."
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-8"
          onChange={(e) => setParam("search", e.target.value || undefined)}
        />
      </div>
      <Select
        items={{ all: "Tất cả trạng thái", ...WARRANTY_STATUS_LABELS }}
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => setParam("status", v === "all" ? undefined : String(v))}
      >
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {WARRANTY_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {WARRANTY_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
