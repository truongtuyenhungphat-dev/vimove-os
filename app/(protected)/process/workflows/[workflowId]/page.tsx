import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getWorkflow } from "@/services/process/workflows";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowCanvas } from "@/components/process/workflow-canvas";
import { TriggerEventSelect } from "@/components/process/trigger-event-select";
import { WORKFLOW_RUN_STATUS_LABELS, type WorkflowDefinition, type WorkflowRunStatus } from "@/lib/process/types";
import { saveDraftAction, publishAction, runWorkflowAction, setTriggerEventTypeAction } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ workflowId: string }> }): Promise<Metadata> {
  const { workflowId } = await params;
  return { title: "Workflow — VIMOVE OS", description: workflowId };
}

export default async function WorkflowBuilderPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const session = await requirePermission("workflows.read");
  const { workflowId } = await params;

  const workflow = await getWorkflow(session.user.organizationId, workflowId);
  if (!workflow || !workflow.currentVersion) notFound();

  const users = await listUsers(session.user.organizationId);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  const canManage = hasPermission(session, "workflows.manage");

  return (
    <>
      <PageHeader title={workflow.name} description={workflow.description ?? undefined} />

      <TriggerEventSelect workflowId={workflow.id} triggerEventType={workflow.triggerEventType} canManage={canManage} onChange={setTriggerEventTypeAction} />

      <Card>
        <CardContent>
          <WorkflowCanvas
            workflowId={workflow.id}
            initialDefinition={workflow.currentVersion.definition as unknown as WorkflowDefinition}
            isPublished={!!workflow.currentVersion.publishedAt}
            isActive={workflow.isActive}
            users={activeUsers}
            onSaveDraft={saveDraftAction}
            onPublish={publishAction}
            onRun={runWorkflowAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-2 text-sm font-medium">Lịch sử chạy gần đây</p>
          <div className="flex flex-col gap-1.5">
            {workflow.runs.map((r) => (
              <Link
                key={r.id}
                href={`/process/runs/${r.id}`}
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent"
              >
                <span className="flex-1 text-muted-foreground">{format(r.createdAt, "dd/MM/yyyy HH:mm")}</span>
                <span>{WORKFLOW_RUN_STATUS_LABELS[r.status as WorkflowRunStatus]}</span>
              </Link>
            ))}
            {workflow.runs.length === 0 && <p className="text-sm text-muted-foreground">Chưa chạy lần nào.</p>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
