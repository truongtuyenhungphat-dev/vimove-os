import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "muted";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-1">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
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
}
