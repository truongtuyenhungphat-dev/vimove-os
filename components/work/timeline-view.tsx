"use client";

import { useState } from "react";
import Link from "next/link";
import { DndContext, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addDays } from "date-fns";
import { toast } from "sonner";
import { DateGridHeader, DAY_WIDTH, dayOffset } from "./date-grid";
import { getDateRangeDays, daySpan } from "@/lib/work/date";
import { cn } from "@/lib/utils";

export type TimelineTask = { id: string; title: string; startAt: string; dueAt: string };

/** Drag tự do — không ràng buộc dependency (khác Gantt). Kéo cả thanh để dời cả khoảng
 * ngày (giữ nguyên độ dài), tính theo delta pixel / DAY_WIDTH → số ngày dịch chuyển. */
export function TimelineView({
  rangeStart,
  rangeEnd,
  tasks,
  onReschedule,
  taskBasePath,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  tasks: TimelineTask[];
  onReschedule: (taskId: string, startAt: Date, dueAt: Date) => Promise<void>;
  /** Base path để dựng href (vd "/work/tasks") — string thay vì function vì props từ
   * Server Component sang Client Component không được là function. */
  taskBasePath: string;
}) {
  const [items, setItems] = useState(tasks);
  const [prevTasks, setPrevTasks] = useState(tasks);
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setItems(tasks);
  }

  const days = getDateRangeDays(rangeStart, rangeEnd);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const dayDelta = Math.round(delta.x / DAY_WIDTH);
    if (dayDelta === 0) return;
    const taskId = String(active.id);
    const task = items.find((t) => t.id === taskId);
    if (!task) return;

    const newStart = addDays(new Date(task.startAt), dayDelta);
    const newDue = addDays(new Date(task.dueAt), dayDelta);
    const previous = items;
    setItems((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, startAt: newStart.toISOString(), dueAt: newDue.toISOString() } : t))
    );

    onReschedule(taskId, newStart, newDue).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Không thể dời lịch — đã khôi phục");
      setItems(previous);
    });
  }

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Chưa có công việc nào có đủ ngày bắt đầu và hạn hoàn thành để hiển thị.
      </p>
    );
  }

  return (
    <DndContext id="timeline-view" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <div style={{ width: days.length * DAY_WIDTH }}>
          <DateGridHeader days={days} />
          <div className="flex flex-col">
            {items.map((task) => (
              <TimelineRow key={task.id} task={task} days={days} href={`${taskBasePath}/${task.id}`} />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function TimelineRow({ task, days, href }: { task: TimelineTask; days: Date[]; href: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const left = dayOffset(days, new Date(task.startAt)) * DAY_WIDTH;
  const width = daySpan(new Date(task.startAt), new Date(task.dueAt)) * DAY_WIDTH;
  const style = {
    left,
    width,
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
  };

  return (
    <div className="relative h-11 border-b border-border/40" style={{ width: days.length * DAY_WIDTH }}>
      {/* ref/listeners trên div bọc ngoài, không phải trực tiếp trên <Link> — thẻ <a> có
       * hành vi kéo-thả gốc của trình duyệt (native drag), xung đột với dnd-kit. */}
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="absolute top-1.5">
        <Link
          href={href}
          className={cn(
            "flex h-8 items-center truncate rounded-md border border-primary/30 bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/15",
            isDragging && "opacity-60 shadow-lg"
          )}
        >
          <span className="truncate">{task.title}</span>
        </Link>
      </div>
    </div>
  );
}
