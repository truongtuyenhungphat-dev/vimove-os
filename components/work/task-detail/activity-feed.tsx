import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { TASK_ACTIVITY_LABELS, type TaskActivityType } from "@/lib/work/types";

export type ActivityItem = { id: string; type: TaskActivityType; createdAt: Date | string; actor: { name: string } | null };

/** Timeline riêng của task này — khác Nhật ký Audit toàn hệ thống ở /admin/audit-logs. */
export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {activities.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{a.actor?.name ?? "Hệ thống"}</span>
          <span className="text-muted-foreground">{TASK_ACTIVITY_LABELS[a.type]}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: vi })}
          </span>
        </div>
      ))}
      {activities.length === 0 && <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>}
    </div>
  );
}
