"use client";

import { useState, useTransition } from "react";
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
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { addMonths, format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { getMonthGridDays, isSameMonth, isSameDay, WEEKDAY_LABELS_VI } from "@/lib/work/date";
import { cn } from "@/lib/utils";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/work/types";

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
  onCreateTask,
  canCreate,
  taskBasePath,
}: {
  monthDate: Date;
  tasks: CalendarTask[];
  onReschedule: (taskId: string, dueAt: Date) => Promise<void>;
  /** Server action tạo công việc (dùng chung với nút "Tạo công việc" ở
   * PageHeader) — truyền xuống để bấm ô ngày có thể thêm việc trực tiếp
   * ngay tại ngày đó, không cần mở trang khác. */
  onCreateTask?: (formData: FormData) => Promise<void>;
  canCreate: boolean;
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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

  const selectedDayTasks = selectedDay ? items.filter((t) => isSameDay(new Date(t.dueAt), selectedDay)) : [];

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
                onOpen={() => setSelectedDay(day)}
              />
            );
          })}
        </div>
      </DndContext>

      <CalendarDayDialog
        day={selectedDay}
        tasks={selectedDayTasks}
        taskBasePath={taskBasePath}
        canCreate={canCreate}
        onCreateTask={onCreateTask}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  tasks,
  taskBasePath,
  onOpen,
}: {
  day: Date;
  inMonth: boolean;
  tasks: CalendarTask[];
  taskBasePath: string;
  onOpen: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Xem/thêm công việc ngày ${format(day, "d/M/yyyy")}`}
      className={cn(
        "group flex min-h-24 cursor-pointer flex-col gap-1 bg-card p-1.5 transition-colors hover:bg-accent/40",
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
    // vi kéo-thả gốc của trình duyệt (native drag), xung đột với dnd-kit. stopPropagation
    // để bấm chip mở task, không vô tình mở luôn dialog "xem/thêm việc" của cả ô ngày.
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
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

/** Dialog mở khi bấm vào 1 ô ngày — vừa xem công việc trong ngày, vừa thêm
 * công việc mới trực tiếp cho đúng ngày đó (dueAt = ngày đã bấm), không phải
 * mở nút "Tạo công việc" chung rồi tự gõ ngày. */
function CalendarDayDialog({
  day,
  tasks,
  taskBasePath,
  canCreate,
  onCreateTask,
  onClose,
}: {
  day: Date | null;
  tasks: CalendarTask[];
  taskBasePath: string;
  canCreate: boolean;
  onCreateTask?: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    if (!day || !onCreateTask) return;
    formData.set("priority", priority);
    formData.set("dueAt", day.toISOString());
    startTransition(async () => {
      try {
        await onCreateTask(formData);
        toast.success("Đã tạo công việc");
        setPriority("MEDIUM");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={!!day} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{day ? format(day, "EEEE, d/M/yyyy", { locale: vi }) : ""}</DialogTitle>
          <DialogDescription>Công việc đến hạn trong ngày — thêm nhanh việc mới cho ngày này.</DialogDescription>
        </DialogHeader>

        {tasks.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Chưa có công việc nào đến hạn ngày này" />
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {tasks.map((t) => (
              <Link
                key={t.id}
                href={`${taskBasePath}/${t.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[t.priority])} aria-hidden="true" />
                <span className="truncate">{t.title}</span>
              </Link>
            ))}
          </div>
        )}

        {canCreate && onCreateTask && (
          <form action={handleCreate} className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="day-task-title">Thêm công việc cho ngày này</Label>
              <Input id="day-task-title" name="title" placeholder="Nhập tiêu đề công việc..." required />
            </div>
            <div className="flex items-center gap-2">
              <Select
                items={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="w-36 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" className="flex-1" disabled={isPending}>
                <Plus className="size-4" aria-hidden="true" /> {isPending ? "Đang thêm..." : "Thêm việc"}
              </Button>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
