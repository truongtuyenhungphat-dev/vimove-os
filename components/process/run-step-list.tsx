"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Loader2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKFLOW_NODE_LABELS, type WorkflowNodeType, type WorkflowStepStatus } from "@/lib/process/types";

export type RunStepItem = {
  id: string;
  nodeId: string;
  nodeType: WorkflowNodeType;
  status: WorkflowStepStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  createdAt: string;
};

const STATUS_STYLE: Record<WorkflowStepStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  RUNNING: "bg-primary/10 text-primary",
  AWAITING_APPROVAL: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SUCCEEDED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  SKIPPED: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<WorkflowStepStatus, string> = {
  PENDING: "Chờ chạy",
  RUNNING: "Đang chạy",
  AWAITING_APPROVAL: "Chờ duyệt",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
  SKIPPED: "Bỏ qua",
};

export function RunStepList({
  steps,
  currentUserId,
  runId,
  onDecide,
}: {
  steps: RunStepItem[];
  currentUserId: string;
  runId: string;
  onDecide: (runId: string, stepId: string, approved: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function decide(stepId: string, approved: boolean) {
    startTransition(async () => {
      try {
        await onDecide(runId, stepId, approved);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((s) => {
        const approvalOutput =
          s.nodeType === "APPROVAL" ? (s.output as { approverIds?: string[]; decisions?: Record<string, boolean> } | null) : null;
        const canDecide =
          s.status === "AWAITING_APPROVAL" &&
          approvalOutput?.approverIds?.includes(currentUserId) &&
          !(currentUserId in (approvalOutput?.decisions ?? {}));

        return (
          <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">{WORKFLOW_NODE_LABELS[s.nodeType]}</span>
              <span className="flex-1 truncate text-sm">{s.nodeId}</span>
              <Badge variant="outline" className={cn("border-transparent font-normal", STATUS_STYLE[s.status])}>
                {STATUS_LABEL[s.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(s.createdAt), "HH:mm:ss")}</span>
            </div>
            {s.error && <p className="text-xs text-destructive">{s.error}</p>}
            {s.output != null && (
              <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(s.output, null, 2)}</pre>
            )}
            {canDecide && (
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => decide(s.id, false)}
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}
                  Từ chối
                </Button>
                <Button type="button" size="sm" disabled={isPending} onClick={() => decide(s.id, true)}>
                  {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                  Duyệt
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {steps.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bước nào chạy.</p>}
    </div>
  );
}
