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
import { LeadCard, type LeadCardData } from "./lead-card";
import { PIPELINE_STAGE_TYPE_LABELS, type PipelineStageType } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export type StageColumn = { id: string; name: string; type: PipelineStageType };

/** Board pipeline lead — cùng pattern KanbanBoard ở Work Hub (Phase 2) nhưng cột động
 * theo PipelineStage của DB thay vì enum cố định, vì mỗi pipeline tự đặt tên/số giai
 * đoạn. Không có `position` trên Lead — thứ tự trong cột không được lưu, chỉ stageId
 * đổi (đúng nghiệm thu "lead chuyển đúng stage transition", không yêu cầu sắp xếp). */
export function LeadPipelineBoard({
  stages,
  leadsByStage,
  onMove,
  leadBasePath,
}: {
  stages: StageColumn[];
  leadsByStage: Record<string, LeadCardData[]>;
  onMove: (leadId: string, stageId: string) => Promise<void>;
  leadBasePath: string;
}) {
  const [columns, setColumns] = useState(leadsByStage);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [prevBoard, setPrevBoard] = useState(leadsByStage);
  if (leadsByStage !== prevBoard) {
    setPrevBoard(leadsByStage);
    setColumns(leadsByStage);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function findColumnOf(leadId: string): string | null {
    for (const stage of stages) {
      if (columns[stage.id]?.some((l) => l.id === leadId)) return stage.id;
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

    const leadId = String(active.id);
    const fromStageId = findColumnOf(leadId);
    if (!fromStageId) return;

    const overId = String(over.id);
    const toStageId = overId.startsWith("column:") ? overId.replace("column:", "") : findColumnOf(overId);
    if (!toStageId || toStageId === fromStageId) return;

    const lead = columns[fromStageId].find((l) => l.id === leadId);
    if (!lead) return;
    const previousColumns = columns;

    setColumns((prev) => ({
      ...prev,
      [fromStageId]: prev[fromStageId].filter((l) => l.id !== leadId),
      [toStageId]: [lead, ...(prev[toStageId] ?? [])],
    }));

    startTransition(async () => {
      try {
        await onMove(leadId, toStageId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể cập nhật — đã khôi phục");
        setColumns(previousColumns);
      }
    });
  }

  const activeLead = activeId ? Object.values(columns).flat().find((l) => l.id === activeId) : null;

  return (
    <DndContext id="lead-pipeline-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stages.map((stage) => (
          <StageColumnView key={stage.id} stage={stage} leads={columns[stage.id] ?? []} leadBasePath={leadBasePath} />
        ))}
      </div>
      <DragOverlay>{activeLead ? <LeadCard lead={activeLead} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function StageColumnView({ stage, leads, leadBasePath }: { stage: StageColumn; leads: LeadCardData[]; leadBasePath: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${stage.id}` });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-medium">{stage.name}</p>
          <p className="text-[10px] text-muted-foreground">{PIPELINE_STAGE_TYPE_LABELS[stage.type]}</p>
        </div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-border/60 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} href={`${leadBasePath}/${lead.id}`} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableLeadCard({ lead, href }: { lead: LeadCardData; href: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} href={href} />
    </div>
  );
}
