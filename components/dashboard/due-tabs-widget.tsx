"use client";

// "Danh sách công việc cần làm" — tham khảo widget cùng tên ở Tổng quan MISA
// AMIS (3 tab theo mốc thời gian: Quá hạn/Đến hạn/Sắp đến hạn, mỗi tab có
// badge số đếm) — đây là bản XEM NHANH trên Dashboard (tối đa 5 dòng/tab, dữ
// liệu thật), bấm "Xem tất cả" sang /work/my-tasks để thấy đầy đủ + lọc theo
// trạng thái (bảng đó đã có sẵn, không lặp lại ở đây).
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskStatusBadge } from "@/components/work/task-badges";
import type { TaskStatus } from "@/lib/work/types";

type TaskRow = { id: string; title: string; status: TaskStatus; dueAt: Date | string | null };
type Tab = "overdue" | "dueToday" | "upcoming";

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function DueTabsWidget({
  overdue,
  dueToday,
  upcoming,
}: {
  overdue: TaskRow[];
  dueToday: TaskRow[];
  upcoming: TaskRow[];
}) {
  const [tab, setTab] = useState<Tab>(overdue.length > 0 ? "overdue" : dueToday.length > 0 ? "dueToday" : "upcoming");
  const lists: Record<Tab, TaskRow[]> = { overdue, dueToday, upcoming };
  const rows = lists[tab];

  return (
    <div className="flex flex-col gap-3">
      {/* flex-col trên mobile — hàng tab (3 tab) + link "Xem tất cả" không đủ
       * chỗ trên cùng 1 dòng ở 414px, bị cắt mất link (phát hiện thật khi
       * test mobile). Tabs tự cuộn ngang riêng (overflow-x-auto) nếu vẫn
       * rộng hơn khung ở màn rất hẹp, thay vì đẩy link ra ngoài màn hình. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overdue">
              Quá hạn <span className="ml-1 rounded-full bg-destructive/10 px-1.5 text-xs text-destructive">{overdue.length}</span>
            </TabsTrigger>
            <TabsTrigger value="dueToday">
              Đến hạn <span className="ml-1 rounded-full bg-amber-500/10 px-1.5 text-xs text-amber-600 dark:text-amber-400">{dueToday.length}</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Sắp đến hạn <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{upcoming.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Link href="/work/my-tasks" className="flex shrink-0 items-center gap-1 self-end text-xs font-medium text-primary hover:underline sm:self-auto">
          Xem tất cả <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Không có việc nào" description="Không có công việc ở nhóm này." />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {rows.map((t) => (
            <Link key={t.id} href={`/work/tasks/${t.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
              <span className="truncate">{t.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <TaskStatusBadge status={t.status} />
                {t.dueAt && <span className="text-xs text-muted-foreground">{fmtDate(t.dueAt)}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
