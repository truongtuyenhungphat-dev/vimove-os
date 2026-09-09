"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { TaskCard, type TaskCardData } from "./task-card";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/work/types";
import { cn } from "@/lib/utils";

type Board = Record<TaskStatus, TaskCardData[]>;

export function KanbanBoard({
  board,
  onMove,
  taskBasePath,
  now,
}: {
  board: Board;
  onMove: (taskId: string, status: TaskStatus, targetIndex: number) => Promise<void>;
  /** Base path để dựng href (vd "/work/tasks") — dùng string thay vì function vì props
   * truyền từ Server Component sang Client Component không được là function. */
  taskBasePath: string;
  now: Date;
}) {
  const [columns, setColumns] = useState<Board>(board);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Đồng bộ lại khi Server Action revalidate xong (dữ liệu thật từ server luôn thắng).
  // Cập nhật ngay trong render (không dùng useEffect) theo pattern "Adjusting state khi
  // props đổi" của React — tránh render thừa mà effect gây ra.
  const [prevBoard, setPrevBoard] = useState(board);
  if (board !== prevBoard) {
    setPrevBoard(board);
    setColumns(board);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function findColumnOf(taskId: string): TaskStatus | null {
    for (const status of TASK_STATUSES) {
      if (columns[status].some((t) => t.id === taskId)) return status;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const fromStatus = findColumnOf(taskId);
    if (!fromStatus) return;

    const overId = String(over.id);
    let toStatus: TaskStatus;
    let targetIndex: number;

    if (overId.startsWith("column:")) {
      toStatus = overId.replace("column:", "") as TaskStatus;
      targetIndex = columns[toStatus].length;
    } else {
      const overStatus = findColumnOf(overId);
      if (!overStatus) return;
      toStatus = overStatus;
      const idx = columns[overStatus].findIndex((t) => t.id === overId);
      targetIndex = idx < 0 ? columns[overStatus].length : idx;
    }

    const currentIndex = columns[fromStatus].findIndex((t) => t.id === taskId);
    if (fromStatus === toStatus && currentIndex === targetIndex) return;

    const task = columns[fromStatus][currentIndex];
    const previousColumns = columns;

    setColumns((prev) => {
      const next: Board = { ...prev };
      next[fromStatus] = prev[fromStatus].filter((t) => t.id !== taskId);
      const targetArr = [...(fromStatus === toStatus ? next[fromStatus] : prev[toStatus])];
      const insertAt = Math.max(0, Math.min(targetIndex, targetArr.length));
      targetArr.splice(insertAt, 0, task);
      next[toStatus] = targetArr;
      return next;
    });

    startTransition(async () => {
      try {
        await onMove(taskId, toStatus, targetIndex);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể cập nhật — đã khôi phục");
        setColumns(previousColumns);
      }
    });
  }

  const activeTask = activeId ? Object.values(columns).flat().find((t) => t.id === activeId) : null;

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={columns[status]} taskBasePath={taskBasePath} now={now} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} dragging now={now} /> : null}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  tasks,
  taskBasePath,
  now,
}: {
  status: TaskStatus;
  tasks: TaskCardData[];
  taskBasePath: string;
  now: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</p>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-border/60 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} href={`${taskBasePath}/${task.id}`} now={now} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, href, now }: { task: TaskCardData; href: string; now: Date }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} href={href} now={now} />
    </div>
  );
}
