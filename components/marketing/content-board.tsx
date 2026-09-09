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
import { ContentCard, type ContentCardData } from "./content-card";
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS, type ContentStatus } from "@/lib/marketing/types";
import { cn } from "@/lib/utils";

type Board = Record<ContentStatus, ContentCardData[]>;

/** Content Hub board — cùng pattern KanbanBoard (Phase 2) với cột cố định theo
 * ContentStatus (Idea→Brief→Script→Production→Review→Approved→Scheduled→Published). */
export function ContentBoard({
  board,
  onMove,
  contentBasePath,
}: {
  board: Board;
  onMove: (contentId: string, status: ContentStatus, targetIndex: number) => Promise<void>;
  contentBasePath: string;
}) {
  const [columns, setColumns] = useState<Board>(board);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [prevBoard, setPrevBoard] = useState(board);
  if (board !== prevBoard) {
    setPrevBoard(board);
    setColumns(board);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function findColumnOf(id: string): ContentStatus | null {
    for (const status of CONTENT_STATUSES) {
      if (columns[status].some((c) => c.id === id)) return status;
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

    const contentId = String(active.id);
    const fromStatus = findColumnOf(contentId);
    if (!fromStatus) return;

    const overId = String(over.id);
    let toStatus: ContentStatus;
    let targetIndex: number;

    if (overId.startsWith("column:")) {
      toStatus = overId.replace("column:", "") as ContentStatus;
      targetIndex = columns[toStatus].length;
    } else {
      const overStatus = findColumnOf(overId);
      if (!overStatus) return;
      toStatus = overStatus;
      const idx = columns[overStatus].findIndex((c) => c.id === overId);
      targetIndex = idx < 0 ? columns[overStatus].length : idx;
    }

    const currentIndex = columns[fromStatus].findIndex((c) => c.id === contentId);
    if (fromStatus === toStatus && currentIndex === targetIndex) return;

    const content = columns[fromStatus][currentIndex];
    const previousColumns = columns;

    setColumns((prev) => {
      const next: Board = { ...prev };
      next[fromStatus] = prev[fromStatus].filter((c) => c.id !== contentId);
      const targetArr = [...(fromStatus === toStatus ? next[fromStatus] : prev[toStatus])];
      const insertAt = Math.max(0, Math.min(targetIndex, targetArr.length));
      targetArr.splice(insertAt, 0, content);
      next[toStatus] = targetArr;
      return next;
    });

    startTransition(async () => {
      try {
        await onMove(contentId, toStatus, targetIndex);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể cập nhật — đã khôi phục");
        setColumns(previousColumns);
      }
    });
  }

  const activeContent = activeId ? Object.values(columns).flat().find((c) => c.id === activeId) : null;

  return (
    <DndContext id="content-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {CONTENT_STATUSES.map((status) => (
          <ContentColumn key={status} status={status} contents={columns[status]} contentBasePath={contentBasePath} />
        ))}
      </div>
      <DragOverlay>{activeContent ? <ContentCard content={activeContent} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function ContentColumn({ status, contents, contentBasePath }: { status: ContentStatus; contents: ContentCardData[]; contentBasePath: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">{CONTENT_STATUS_LABELS[status]}</p>
        <span className="text-xs text-muted-foreground">{contents.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-border/60 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        <SortableContext items={contents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {contents.map((content) => (
            <SortableContentCard key={content.id} content={content} href={`${contentBasePath}/${content.id}`} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableContentCard({ content, href }: { content: ContentCardData; href: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: content.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContentCard content={content} href={href} />
    </div>
  );
}
