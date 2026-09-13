import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "muted" | "warning";
  /** Tuỳ chọn — có thì cả card bấm được, điều hướng sang module tương ứng (dùng
   * ở Dashboard tổng quan để mỗi KPI dẫn thẳng tới trang chi tiết của nó). */
  href?: string;
}) {
  const card = (
    <Card className={cn(href && "transition-shadow hover:shadow-md")}>
      <CardContent className="flex items-center gap-4 py-1">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "muted" && "bg-muted text-muted-foreground",
            tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums leading-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );

  // Card (components/ui/card.tsx) không hỗ trợ prop `render` polymorphic như
  // Button/CardTitle (chỉ CardTitle dùng useRender trong file đó) — bọc thủ
  // công bằng Link thay vì truyền render vào Card.
  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
