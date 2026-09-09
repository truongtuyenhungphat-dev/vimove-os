"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { cn } from "@/lib/utils";
import { APPROVAL_ENTITY_LABELS, APPROVAL_STATUS_LABELS, type ApprovalEntityType, type ApprovalStatus, type ApprovalStepStatus } from "@/lib/process/types";

export type ApprovalStepItem = {
  id: string;
  position: number;
  approverId: string;
  approver: { name: string };
  status: ApprovalStepStatus;
  comment: string | null;
  decidedAt: string | null;
  escalatedAt: string | null;
};

export type ApprovalRequestItem = {
  id: string;
  title: string;
  entityType: ApprovalEntityType;
  entityId: string;
  mode: "SEQUENTIAL" | "PARALLEL";
  status: ApprovalStatus;
  dueAt: string | null;
  createdAt: string;
  requestedBy: { name: string };
  steps: ApprovalStepItem[];
};

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STEP_STYLE: Record<ApprovalStepStatus, string> = {
  PENDING: "text-muted-foreground",
  APPROVED: "text-emerald-600 dark:text-emerald-400",
  REJECTED: "text-destructive",
  SKIPPED: "text-muted-foreground line-through",
};

function entityHref(entityType: ApprovalEntityType, entityId: string) {
  if (entityType === "TASK") return `/work/tasks/${entityId}`;
  return undefined;
}

export function ApprovalCard({
  request,
  currentUserId,
  actionableStepId,
  canManage,
  onDecide,
  onCancel,
}: {
  request: ApprovalRequestItem;
  currentUserId: string;
  /** Step mà currentUserId được phép bấm Duyệt/Từ chối ngay bây giờ (đã tính sequential/parallel ở server). */
  actionableStepId?: string;
  canManage: boolean;
  onDecide: (stepId: string, decision: "APPROVED" | "REJECTED", comment?: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const href = entityHref(request.entityType, request.entityId);
  const overdue = request.status === "PENDING" && request.dueAt && new Date(request.dueAt) < new Date();

  function decide(stepId: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      try {
        await onDecide(stepId, decision, comment || undefined);
        setComment("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          {href ? (
            <a href={href} className="font-medium hover:underline">
              {request.title}
            </a>
          ) : (
            <p className="font-medium">{request.title}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {APPROVAL_ENTITY_LABELS[request.entityType]} · Yêu cầu bởi {request.requestedBy.name} ·{" "}
            {format(new Date(request.createdAt), "dd/MM/yyyy")} · {request.mode === "SEQUENTIAL" ? "Tuần tự" : "Song song"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdue && (
            <Badge variant="outline" className="border-transparent bg-destructive/10 font-normal text-destructive">
              Quá hạn
            </Badge>
          )}
          <Badge variant="outline" className={cn("border-transparent font-normal", STATUS_STYLE[request.status])}>
            {APPROVAL_STATUS_LABELS[request.status]}
          </Badge>
          {canManage && request.status === "PENDING" && onCancel && (
            <ConfirmDeleteButton title="Huỷ yêu cầu duyệt" description={`Huỷ yêu cầu "${request.title}"?`} onConfirm={() => onCancel(request.id)} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {request.steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 shrink-0 text-xs text-muted-foreground">#{s.position + 1}</span>
            <span className={cn("flex-1", STEP_STYLE[s.status])}>
              {s.approver.name}
              {s.approverId === currentUserId && <span className="ml-1 text-xs text-primary">(bạn)</span>}
            </span>
            {s.escalatedAt && (
              <Badge variant="outline" className="border-transparent bg-destructive/10 font-normal text-destructive">
                Đã escalate
              </Badge>
            )}
            <span className={cn("text-xs", STEP_STYLE[s.status])}>
              {s.status === "PENDING" ? "Đang chờ" : s.status === "APPROVED" ? "Đã duyệt" : s.status === "REJECTED" ? "Từ chối" : "Bỏ qua"}
            </span>
          </div>
        ))}
      </div>

      {actionableStepId && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          <Input
            placeholder="Ghi chú (tuỳ chọn)"
            className="h-8"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => decide(actionableStepId, "REJECTED")}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}
              Từ chối
            </Button>
            <Button type="button" size="sm" disabled={isPending} onClick={() => decide(actionableStepId, "APPROVED")}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              Duyệt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
