import Link from "next/link";
import { format, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKLOAD_WARN_THRESHOLD, WORKLOAD_OVER_THRESHOLD, type WorkloadTone } from "@/lib/work/workload";

const TONE_BAR: Record<WorkloadTone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  over: "bg-destructive",
};
const TONE_TEXT: Record<WorkloadTone, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  over: "text-destructive",
};

export type WorkloadRow = { id: string; name: string; percent: number; tone: WorkloadTone; meta: string };

export function WorkloadView({
  weekStart,
  weekEnd,
  users,
  teams,
}: {
  weekStart: Date;
  weekEnd: Date;
  users: WorkloadRow[];
  teams: WorkloadRow[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Tuần {format(weekStart, "dd/MM")} – {format(weekEnd, "dd/MM/yyyy")}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`?week=${format(addWeeks(weekStart, -1), "yyyy-MM-dd")}`}
            aria-label="Tuần trước"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`?week=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`}
            aria-label="Tuần sau"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {teams.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">Theo nhóm</p>
            {teams.map((t) => (
              <WorkloadBar key={t.id} row={t} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Theo người phụ trách</p>
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có công việc nào được lên lịch trong tuần này.</p>
          )}
          {users.map((u) => (
            <WorkloadBar key={u.id} row={u} />
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Công thức: tổng giờ ước lượng các việc đang mở (không Hoàn thành/Đã huỷ) giao với tuần, chia cho 40 giờ
        chuẩn mỗi tuần. Ngưỡng: dưới {WORKLOAD_WARN_THRESHOLD}% ổn định · {WORKLOAD_WARN_THRESHOLD}–
        {WORKLOAD_OVER_THRESHOLD}% cần chú ý · trên {WORKLOAD_OVER_THRESHOLD}% quá tải.
      </p>
    </div>
  );
}

function WorkloadBar({ row }: { row: WorkloadRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm">{row.name}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", TONE_BAR[row.tone])}
          style={{ width: `${Math.min(row.percent, 100)}%` }}
        />
      </div>
      <span className={cn("w-28 shrink-0 text-right text-xs font-medium tabular-nums", TONE_TEXT[row.tone])}>
        {row.percent}% · {row.meta}
      </span>
    </div>
  );
}
