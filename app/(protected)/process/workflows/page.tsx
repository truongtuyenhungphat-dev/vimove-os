import type { Metadata } from "next";
import Link from "next/link";
import { Workflow as WorkflowIcon } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listWorkflows } from "@/services/process/workflows";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowCreateDialog } from "@/components/process/workflow-create-dialog";
import { createWorkflowAction } from "./actions";

export const metadata: Metadata = { title: "Workflow — VIMOVE OS" };

export default async function WorkflowsPage() {
  const session = await requirePermission("workflows.read");
  const canManage = hasPermission(session, "workflows.manage");

  const workflows = await listWorkflows(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Workflow Builder"
        description="Tự động hoá quy trình bằng kéo-thả node"
        actions={canManage ? <WorkflowCreateDialog action={createWorkflowAction} /> : undefined}
      />

      {workflows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={WorkflowIcon} title="Chưa có workflow nào" description="Tạo workflow đầu tiên để bắt đầu." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <Link key={w.id} href={`/process/workflows/${w.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{w.name}</p>
                    <Badge
                      variant="outline"
                      className={
                        w.isActive
                          ? "border-transparent bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400"
                          : "border-transparent bg-muted font-normal text-muted-foreground"
                      }
                    >
                      {w.isActive ? "Đang bật" : "Nháp"}
                    </Badge>
                  </div>
                  {w.description && <p className="line-clamp-2 text-sm text-muted-foreground">{w.description}</p>}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>v{w.currentVersion?.version ?? 1}</span>
                    <span>{w._count.runs} lần chạy</span>
                    <span>Tạo bởi {w.createdBy.name}</span>
                  </div>
                  {w.triggerEventType && (
                    <Badge variant="outline" className="w-fit border-transparent bg-sky-500/10 font-normal text-sky-600 dark:text-sky-400">
                      Tự động: {w.triggerEventType}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
