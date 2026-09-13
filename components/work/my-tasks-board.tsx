"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday } from "date-fns";
import { ClipboardList, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskStatusBadge, TaskPriorityBadge } from "./task-badges";
import { cn } from "@/lib/utils";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus, type TaskPriority } from "@/lib/work/types";

export type MyTaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | string | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  _count: { comments: number; checklistItems: number; attachments: number };
};

/** Bảng "Việc của tôi" — lọc theo trạng thái ngay trên client (dữ liệu đã tải hết sẵn,
 * không cần round-trip server cho danh sách nhỏ của riêng 1 người dùng). */
export function MyTasksBoard({ tasks, now }: { tasks: MyTaskRow[]; now: Date }) {
  const [tab, setTab] = useState<"all" | TaskStatus>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length };
    for (const status of TASK_STATUSES) c[status] = tasks.filter((t) => t.status === status).length;
    return c;
  }, [tasks]);

  const filtered = tab === "all" ? tasks : tasks.filter((t) => t.status === tab);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | TaskStatus)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Tất cả ({counts.all})</TabsTrigger>
            {TASK_STATUSES.filter((s) => s !== "CANCELLED" || counts.CANCELLED > 0).map((status) => (
              <TabsTrigger key={status} value={status}>
                {TASK_STATUS_LABELS[status]} ({counts[status]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === "all" ? "Bạn chưa có công việc nào" : "Không có việc nào ở trạng thái này"}
            description={tab === "all" ? "Công việc được gán cho bạn sẽ hiện ở đây." : "Thử chọn tab khác."}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công việc</TableHead>
                  <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Độ ưu tiên</TableHead>
                  <TableHead>Hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => {
                  const dueDate = task.dueAt ? new Date(task.dueAt) : null;
                  const isDone = task.status === "DONE" || task.status === "CANCELLED";
                  const overdue = dueDate ? dueDate.getTime() < now.getTime() && !isDone : false;
                  const dueSoon = dueDate ? isToday(dueDate) && !isDone : false;

                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Link href={`/work/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                          <TaskStatusBadge status={task.status} />
                          <TaskPriorityBadge priority={task.priority} />
                        </div>
                        {task.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.tags.map(({ tag }) => (
                              <span
                                key={tag.id}
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <TaskStatusBadge status={task.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <TaskPriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell>
                        {dueDate ? (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-sm",
                              overdue ? "font-medium text-destructive" : dueSoon ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            )}
                          >
                            <Calendar className="size-3.5" />
                            {overdue ? `Quá hạn ${format(dueDate, "dd/MM")}` : dueSoon ? "Hôm nay" : format(dueDate, "dd/MM/yyyy")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
