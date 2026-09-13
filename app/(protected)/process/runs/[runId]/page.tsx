import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requirePermission } from "@/lib/auth/rbac";
import { getWorkflowRun } from "@/services/process/workflow-engine";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunStepList } from "@/components/process/run-step-list";
import { WORKFLOW_RUN_STATUS_LABELS, type WorkflowRunStatus } from "@/lib/process/types";
import { decideRunStepAction } from "../actions";

const RUN_STATUS_STYLE: Record<WorkflowRunStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  RUNNING: "bg-primary/10 text-primary",
  AWAITING_APPROVAL: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SUCCEEDED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export async function generateMetadata({ params }: { params: Promise<{ runId: string }> }): Promise<Metadata> {
  const { runId } = await params;
  return { title: "Run log — VIMOVE OS", description: runId };
}

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const session = await requirePermission("workflows.read");
  const { runId } = await params;

  const run = await getWorkflowRun(session.user.organizationId, runId);
  if (!run) notFound();

  return (
    <>
      <PageHeader
        title={`Run log: ${run.workflow.name}`}
        description={`Chạy bởi ${run.createdBy.name} · ${format(run.createdAt, "dd/MM/yyyy HH:mm")}`}
        actions={
          <Badge variant="outline" className={`border-transparent font-normal ${RUN_STATUS_STYLE[run.status as WorkflowRunStatus]}`}>
            {WORKFLOW_RUN_STATUS_LABELS[run.status as WorkflowRunStatus]}
          </Badge>
        }
      />

      <Link href={`/process/workflows/${run.workflow.id}`} className="text-sm text-primary hover:underline">
        ← Quay lại workflow
      </Link>

      <Card>
        <CardContent>
          <RunStepList
            steps={run.steps.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
            currentUserId={session.user.id}
            runId={run.id}
            onDecide={decideRunStepAction}
          />
        </CardContent>
      </Card>
    </>
  );
}
