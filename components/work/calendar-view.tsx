"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format } from "date-fns";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { getMonthGridDays, isSameMonth, isSameDay, WEEKDAY_LABELS_VI } from "@/lib/work/date";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/work/types";

export type CalendarTask = { id: string; title: string; priority: TaskPriority; dueAt: string };

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-muted-foreground",
  MEDIUM: "bg-sky-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-destructive",
};

export function CalendarView({
  monthDate,
  tasks,
  onReschedule,
  taskBasePath,
}: {
  monthDate: Date;
  tasks: CalendarTask[];
  onReschedule: (taskId: string, dueAt: Date) => Promise<void>;
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const days = getMonthGridDays(monthDate);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newDate = new Date(String(over.id));
    const task = items.find((t) => t.id === taskId);
    if (!task || isSameDay(new Date(task.dueAt), newDate)) return;

    const previous = items;
    setItems((prev) => prev.map((t) => (t.id === taskId ? { ...t, dueAt: newDate.toISOString() } : t)));

    onReschedule(taskId, newDate).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Không thể dời lịch — đã khôi phục");
      setItems(previous);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{format(monthDate, "MM/yyyy")}</p>
        <div className="flex items-center gap-1">
          <Link
            href={`?month=${format(addMonths(monthDate, -1), "yyyy-MM")}`}
            aria-label="Tháng trước"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`?month=${format(addMonths(monthDate, 1), "yyyy-MM")}`}
            aria-label="Tháng sau"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <DndContext id="calendar-view" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
          {WEEKDAY_LABELS_VI.map((label) => (
            <div key={label} className="bg-muted px-2 py-1.5 text-center font-medium text-muted-foreground">
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = items.filter((t) => isSameDay(new Date(t.dueAt), day));
            return (
              <DayCell
                key={day.toISOString()}
                day={day}
                inMonth={isSameMonth(day, monthDate)}
                tasks={dayTasks}
                taskBasePath={taskBasePath}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  tasks,
  taskBasePath,
}: {
  day: Date;
  inMonth: boolean;
  tasks: CalendarTask[];
  taskBasePath: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-24 flex-col gap-1 bg-card p-1.5",
        !inMonth && "bg-muted/30 text-muted-foreground",
        isOver && "bg-primary/5 ring-1 ring-inset ring-primary/40"
      )}
    >
      <span className="text-[11px] font-medium">{format(day, "d")}</span>
      <div className="flex flex-col gap-1">
        {tasks.map((t) => (
          <DraggableChip key={t.id} task={t} href={`${taskBasePath}/${t.id}`} />
        ))}
      </div>
    </div>
  );
}

function DraggableChip({ task, href }: { task: CalendarTask; href: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined;
  return (
    // ref/listeners trên div bọc ngoài, không phải trực tiếp trên <Link> — thẻ <a> có hành
    // vi kéo-thả gốc của trình duyệt (native drag), xung đột với dnd-kit.
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={href}
        title={`${task.title} — Độ ưu tiên: ${TASK_PRIORITY_LABELS[task.priority]}`}
        className={cn(
          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] hover:bg-accent",
          isDragging && "opacity-50"
        )}
      >
        <span
          className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
          aria-hidden="true"
        />
        <span className="truncate">{task.title}</span>
      </Link>
    </div>
  );
}
