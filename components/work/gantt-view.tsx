"use client";

import { useState } from "react";
import Link from "next/link";
import { DndContext, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addDays, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { DateGridHeader, DAY_WIDTH, ROW_HEIGHT, dayOffset } from "./date-grid";
import { getDateRangeDays, daySpan } from "@/lib/work/date";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/work/types";

export type GanttTask = {
  id: string;
  title: string;
  status: TaskStatus;
  startAt: string;
  dueAt: string;
  dependsOnIds: string[];
};

function getMinStartAt(task: GanttTask, all: GanttTask[]): Date | null {
  const dueDates = task.dependsOnIds
    .map((id) => all.find((t) => t.id === id)?.dueAt)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d));
  if (dueDates.length === 0) return null;
  return new Date(Math.max(...dueDates.map((d) => d.getTime())));
}

/**
 * Kéo bị chặn ở client (clamp về mốc sớm nhất được phép) VÀ server re-validate lại
 * (rescheduleTask với enforceDependencies=true) — không tin client, xem
 * services/tasks/tasks.ts.
 */
export function GanttView({
  rangeStart,
  rangeEnd,
  tasks,
  onReschedule,
  taskBasePath,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  tasks: GanttTask[];
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
    let dayDelta = Math.round(delta.x / DAY_WIDTH);
    if (dayDelta === 0) return;
    const taskId = String(active.id);
    const task = items.find((t) => t.id === taskId);
    if (!task) return;

    let newStart = addDays(new Date(task.startAt), dayDelta);
    let newDue = addDays(new Date(task.dueAt), dayDelta);

    const minStart = getMinStartAt(task, items);
    if (minStart && newStart < minStart) {
      dayDelta = differenceInCalendarDays(minStart, new Date(task.startAt));
      newStart = addDays(new Date(task.startAt), dayDelta);
      newDue = addDays(new Date(task.dueAt), dayDelta);
      toast.info("Đã giới hạn theo phụ thuộc — công việc trước đó chưa hoàn thành tới ngày này");
    }
    if (dayDelta === 0) return;

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
    <DndContext id="gantt-view" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <div style={{ width: days.length * DAY_WIDTH }}>
          <DateGridHeader days={days} />
          <div className="relative flex flex-col">
            {items.map((task) => (
              <GanttRow key={task.id} task={task} days={days} href={`${taskBasePath}/${task.id}`} />
            ))}
            <DependencyArrows items={items} days={days} />
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function GanttRow({ task, days, href }: { task: GanttTask; days: Date[]; href: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const left = dayOffset(days, new Date(task.startAt)) * DAY_WIDTH;
  const width = daySpan(new Date(task.startAt), new Date(task.dueAt)) * DAY_WIDTH;
  const style = {
    left,
    width,
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
  };
  const barTone =
    task.status === "DONE"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : task.status === "CANCELLED"
        ? "border-border bg-muted text-muted-foreground"
        : "border-primary/30 bg-primary/10 text-primary";

  return (
    <div className="relative border-b border-border/40" style={{ height: ROW_HEIGHT, width: days.length * DAY_WIDTH }}>
      {/* ref/listeners trên div bọc ngoài, không phải trực tiếp trên <Link> — thẻ <a> có
       * hành vi kéo-thả gốc của trình duyệt (native drag), xung đột với dnd-kit. */}
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="absolute top-2">
        <Link
          href={href}
          className={cn(
            "flex h-7 items-center truncate rounded-md border px-2 text-xs font-medium hover:brightness-95",
            barTone,
            isDragging && "opacity-60 shadow-lg"
          )}
        >
          <span className="truncate">{task.title}</span>
        </Link>
      </div>
    </div>
  );
}

function DependencyArrows({ items, days }: { items: GanttTask[]; days: Date[] }) {
  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  items.forEach((task, rowIndex) => {
    task.dependsOnIds.forEach((depId) => {
      const depIndex = items.findIndex((t) => t.id === depId);
      if (depIndex === -1) return;
      const depTask = items[depIndex];
      const x1 = (dayOffset(days, new Date(depTask.dueAt)) + 1) * DAY_WIDTH;
      const y1 = depIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = dayOffset(days, new Date(task.startAt)) * DAY_WIDTH;
      const y2 = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      edges.push({ x1, y1, x2, y2, key: `${depId}->${task.id}` });
    });
  });

  if (edges.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0"
      width={days.length * DAY_WIDTH}
      height={items.length * ROW_HEIGHT}
      aria-hidden="true"
    >
      <defs>
        <marker id="gantt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
        </marker>
      </defs>
      {edges.map((e) => (
        <path
          key={e.key}
          d={`M${e.x1},${e.y1} L${e.x1 + 8},${e.y1} L${e.x1 + 8},${e.y2} L${e.x2},${e.y2}`}
          fill="none"
          className="stroke-muted-foreground/50"
          strokeWidth={1.5}
          markerEnd="url(#gantt-arrow)"
        />
      ))}
    </svg>
  );
}
