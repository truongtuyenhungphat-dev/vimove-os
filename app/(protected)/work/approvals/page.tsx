import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listMyPendingApprovals, listAllApprovals, getMyRequestedApprovals, escalateOverdueSteps } from "@/services/process/approvals";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApprovalCard, type ApprovalRequestItem } from "@/components/process/approval-card";
import { decideStepAction, cancelApprovalAction } from "./actions";

export const metadata: Metadata = { title: "Approval Hub — VIMOVE OS" };

function serialize(request: {
  id: string; title: string; entityType: string; entityId: string; mode: string; status: string;
  dueAt: Date | null; createdAt: Date; requestedBy: { name: string };
  steps: { id: string; position: number; approverId: string; approver: { name: string }; status: string; comment: string | null; decidedAt: Date | null; escalatedAt: Date | null }[];
}): ApprovalRequestItem {
  return {
    ...request,
    entityType: request.entityType as ApprovalRequestItem["entityType"],
    mode: request.mode as ApprovalRequestItem["mode"],
    status: request.status as ApprovalRequestItem["status"],
    dueAt: request.dueAt ? request.dueAt.toISOString() : null,
    createdAt: request.createdAt.toISOString(),
    steps: request.steps.map((s) => ({
      ...s,
      status: s.status as ApprovalRequestItem["steps"][number]["status"],
      decidedAt: s.decidedAt ? s.decidedAt.toISOString() : null,
      escalatedAt: s.escalatedAt ? s.escalatedAt.toISOString() : null,
    })),
  };
}

export default async function ApprovalsPage() {
  const session = await requirePermission("approvals.read");
  const canManage = hasPermission(session, "approvals.manage");

  // Escalation cơ bản chạy on-read (không cần cron) — xem services/process/approvals.ts.
  await escalateOverdueSteps(session.user.organizationId);

  const [pending, myRequests, all] = await Promise.all([
    listMyPendingApprovals(session.user.organizationId, session.user.id),
    getMyRequestedApprovals(session.user.organizationId, session.user.id),
    canManage ? listAllApprovals(session.user.organizationId) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader title="Approval Hub" description="Yêu cầu duyệt dùng chung cho Task và các module khác" />

      <Card>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Chờ tôi duyệt ({pending.filter((p) => p.actionable).length})</TabsTrigger>
              <TabsTrigger value="requested">Yêu cầu của tôi ({myRequests.length})</TabsTrigger>
              {canManage && <TabsTrigger value="all">Tất cả ({all.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="pending" className="flex flex-col gap-3 pt-3">
              {pending.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="Không có yêu cầu nào cần bạn duyệt" />
              ) : (
                pending.map(({ request, step, actionable }) => (
                  <ApprovalCard
                    key={request.id}
                    request={serialize(request)}
                    currentUserId={session.user.id}
                    actionableStepId={actionable ? step.id : undefined}
                    canManage={canManage}
                    onDecide={decideStepAction}
                    onCancel={canManage ? cancelApprovalAction : undefined}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="requested" className="flex flex-col gap-3 pt-3">
              {myRequests.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="Bạn chưa gửi yêu cầu duyệt nào" />
              ) : (
                myRequests.map((r) => (
                  <ApprovalCard
                    key={r.id}
                    request={serialize(r)}
                    currentUserId={session.user.id}
                    canManage={canManage}
                    onDecide={decideStepAction}
                    onCancel={canManage ? cancelApprovalAction : undefined}
                  />
                ))
              )}
            </TabsContent>

            {canManage && (
              <TabsContent value="all" className="flex flex-col gap-3 pt-3">
                {all.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="Chưa có yêu cầu duyệt nào trong tổ chức" />
                ) : (
                  all.map((r) => (
                    <ApprovalCard
                      key={r.id}
                      request={serialize(r)}
                      currentUserId={session.user.id}
                      canManage={canManage}
                      onDecide={decideStepAction}
                      onCancel={cancelApprovalAction}
                    />
                  ))
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
