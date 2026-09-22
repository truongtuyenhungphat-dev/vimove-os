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
import { PieceCard, type PieceCardData } from "./piece-card";
import { CONTENT_PIECE_STAGES, CONTENT_PIECE_STAGE_LABELS, type ContentPieceStage } from "@/lib/production/types";
import { cn } from "@/lib/utils";

type Board = Record<ContentPieceStage, PieceCardData[]>;

/** Kanban sản xuất — cùng pattern ContentBoard (Content Hub) với cột cố định theo
 * ContentPieceStage (Ý tưởng→Viết KB→Quay→Edit→Chờ duyệt→Đã đăng). Chuyển thẻ vào
 * SCRIPT/SHOOT/EDIT/POSTED tự cộng vào bảng đếm tiến độ hôm đó — xem moveContentPiece. */
export function KanbanBoard({
  board,
  onMove,
  onDelete,
  canDelete,
}: {
  board: Board;
  onMove: (pieceId: string, stage: ContentPieceStage, targetIndex: number) => Promise<void>;
  onDelete: (pieceId: string) => Promise<void>;
  canDelete: boolean;
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

  function findColumnOf(id: string): ContentPieceStage | null {
    for (const stage of CONTENT_PIECE_STAGES) {
      if (columns[stage].some((c) => c.id === id)) return stage;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function applyMove(pieceId: string, toStage: ContentPieceStage, targetIndex: number) {
    const fromStage = findColumnOf(pieceId);
    if (!fromStage) return;

    const currentIndex = columns[fromStage].findIndex((c) => c.id === pieceId);
    if (fromStage === toStage && currentIndex === targetIndex) return;

    const piece = columns[fromStage][currentIndex];
    const previousColumns = columns;

    setColumns((prev) => {
      const next: Board = { ...prev };
      next[fromStage] = prev[fromStage].filter((c) => c.id !== pieceId);
      const targetArr = [...(fromStage === toStage ? next[fromStage] : prev[toStage])];
      const insertAt = Math.max(0, Math.min(targetIndex, targetArr.length));
      targetArr.splice(insertAt, 0, piece);
      next[toStage] = targetArr;
      return next;
    });

    startTransition(async () => {
      try {
        await onMove(pieceId, toStage, targetIndex);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể cập nhật — đã khôi phục");
        setColumns(previousColumns);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const pieceId = String(active.id);
    const fromStage = findColumnOf(pieceId);
    if (!fromStage) return;

    const overId = String(over.id);
    let toStage: ContentPieceStage;
    let targetIndex: number;

    if (overId.startsWith("column:")) {
      toStage = overId.replace("column:", "") as ContentPieceStage;
      targetIndex = columns[toStage].length;
    } else {
      const overStage = findColumnOf(overId);
      if (!overStage) return;
      toStage = overStage;
      const idx = columns[overStage].findIndex((c) => c.id === overId);
      targetIndex = idx < 0 ? columns[overStage].length : idx;
    }

    applyMove(pieceId, toStage, targetIndex);
  }

  function handleChangeStage(pieceId: string, toStage: ContentPieceStage) {
    applyMove(pieceId, toStage, columns[toStage].length);
  }

  function handleDelete(pieceId: string) {
    const fromStage = findColumnOf(pieceId);
    if (!fromStage) return;
    const previousColumns = columns;
    setColumns((prev) => ({ ...prev, [fromStage]: prev[fromStage].filter((c) => c.id !== pieceId) }));
    startTransition(async () => {
      try {
        await onDelete(pieceId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không xoá được — đã khôi phục");
        setColumns(previousColumns);
      }
    });
  }

  const activePiece = activeId ? Object.values(columns).flat().find((c) => c.id === activeId) : null;

  return (
    <DndContext id="production-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {CONTENT_PIECE_STAGES.map((stage) => (
          <Column key={stage} stage={stage} pieces={columns[stage]} canDelete={canDelete} onDelete={handleDelete} onChangeStage={handleChangeStage} />
        ))}
      </div>
      <DragOverlay>{activePiece ? <PieceCard piece={activePiece} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  pieces,
  canDelete,
  onDelete,
  onChangeStage,
}: {
  stage: ContentPieceStage;
  pieces: PieceCardData[];
  canDelete: boolean;
  onDelete: (id: string) => void;
  onChangeStage: (pieceId: string, toStage: ContentPieceStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${stage}` });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">{CONTENT_PIECE_STAGE_LABELS[stage]}</p>
        <span className="text-xs text-muted-foreground">{pieces.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-border/60 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        <SortableContext items={pieces.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {pieces.map((piece) => (
            <SortablePieceCard
              key={piece.id}
              piece={piece}
              currentStage={stage}
              canDelete={canDelete}
              onDelete={() => onDelete(piece.id)}
              onChangeStage={onChangeStage}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortablePieceCard({
  piece,
  currentStage,
  canDelete,
  onDelete,
  onChangeStage,
}: {
  piece: PieceCardData;
  currentStage: ContentPieceStage;
  canDelete: boolean;
  onDelete: () => void;
  onChangeStage: (pieceId: string, toStage: ContentPieceStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: piece.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PieceCard piece={piece} currentStage={currentStage} canDelete={canDelete} onDelete={onDelete} onChangeStage={onChangeStage} />
    </div>
  );
}
