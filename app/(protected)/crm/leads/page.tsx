import type { Metadata } from "next";
import Link from "next/link";
import { Users2, Settings2, UserPlus, Wallet, Trophy, Target } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listPipelines } from "@/services/crm/pipelines";
import { listLeadsBoard } from "@/services/crm/leads";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { LeadDialog } from "@/components/crm/lead-dialog";
import { LeadPipelineBoard, type StageColumn } from "@/components/crm/lead-pipeline-board";
import type { LeadCardData } from "@/components/crm/lead-card";
import { createLeadAction, moveLeadStageAction } from "./actions";

export const metadata: Metadata = { title: "Lead — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipelineId?: string }>;
}) {
  const session = await requirePermission("leads.read");
  const canCreate = hasPermission(session, "leads.create");
  const canManageCatalog = hasPermission(session, "sales_catalog.manage");
  const { pipelineId } = await searchParams;

  const pipelines = await listPipelines(session.user.organizationId);

  if (pipelines.length === 0) {
    return (
      <>
        <PageHeader title="Lead" description="Quản lý lead theo pipeline" />
        <EmptyState
          icon={Users2}
          title="Chưa có pipeline nào"
          description={canManageCatalog ? "Tạo pipeline đầu tiên để bắt đầu quản lý lead." : "Liên hệ quản trị viên để tạo pipeline."}
          action={
            canManageCatalog ? (
              <Button size="sm" nativeButton={false} render={<Link href="/crm/pipelines" />}>
                Tạo pipeline
              </Button>
            ) : undefined
          }
        />
      </>
    );
  }

  const activePipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines.find((p) => p.isDefault) ?? pipelines[0];
  const visibility = buildVisibilityScope(session, "leads.read");
  const [leads, users] = await Promise.all([
    listLeadsBoard(session.user.organizationId, activePipeline.id, visibility),
    listUsers(session.user.organizationId),
  ]);

  const scopeDescription =
    visibility.scope === "OWN"
      ? "Lead của bạn (phạm vi quyền của vai trò hiện tại)"
      : visibility.scope === "DEPARTMENT"
        ? "Lead của phòng ban bạn (phạm vi quyền của vai trò hiện tại)"
        : "Quản lý lead theo pipeline";
  const stages: StageColumn[] = activePipeline.stages.map((s) => ({ id: s.id, name: s.name, type: s.type }));
  const leadsByStage: Record<string, LeadCardData[]> = {};
  for (const stage of stages) leadsByStage[stage.id] = [];
  for (const lead of leads) leadsByStage[lead.stage.id]?.push(lead);

  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));
  const firstStageId = stages[0]?.id ?? "";

  // KPI dải đầu trang — tính từ chính `leads` đã tải cho board (đã scope theo
  // pipeline + visibility), không query thêm để tránh N+1.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newLeadsThisWeek = leads.filter((l) => new Date(l.createdAt) >= sevenDaysAgo).length;
  const openPipelineValue = leads
    .filter((l) => l.stage.type === "OPEN")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const wonCount = leads.filter((l) => l.stage.type === "WON").length;
  const lostCount = leads.filter((l) => l.stage.type === "LOST").length;
  const conversionRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Lead"
        description={scopeDescription}
        actions={
          <div className="flex items-center gap-2">
            {pipelines.length > 1 && (
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                {pipelines.map((p) => (
                  <Button
                    key={p.id}
                    size="sm"
                    variant={p.id === activePipeline.id ? "secondary" : "ghost"}
                    nativeButton={false}
                    render={<Link href={`/crm/leads?pipelineId=${p.id}`} />}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            )}
            {canManageCatalog && (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/crm/pipelines" />}>
                <Settings2 /> Pipeline
              </Button>
            )}
            {canCreate && firstStageId && (
              <LeadDialog mode="create" owners={activeUsers} action={createLeadAction.bind(null, activePipeline.id, firstStageId)} />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Lead mới tuần này" value={newLeadsThisWeek} icon={UserPlus} tone={newLeadsThisWeek > 0 ? "primary" : "muted"} />
        <KpiCard label="Tổng lead trong pipeline" value={leads.length} icon={Target} tone="muted" />
        <KpiCard label="Giá trị đang mở" value={formatVnd(openPipelineValue)} icon={Wallet} tone="primary" hint="Tổng giá trị lead chưa thắng/thua" />
        <KpiCard label="Tỷ lệ chuyển đổi" value={`${conversionRate.toFixed(0)}%`} icon={Trophy} tone="muted" hint={`${wonCount} thắng / ${lostCount} thua`} />
      </div>

      <LeadPipelineBoard stages={stages} leadsByStage={leadsByStage} onMove={moveLeadStageAction} leadBasePath="/crm/leads" />
    </>
  );
}
