import type { Metadata } from "next";
import { FileEdit, Send, CalendarClock, Hourglass } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getContentBoard } from "@/services/marketing/content";
import { listCampaigns } from "@/services/marketing/campaigns";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ContentDialog } from "@/components/marketing/content-dialog";
import { ContentBoard } from "@/components/marketing/content-board";
import { createContentAction, moveContentStatusAction } from "./actions";

export const metadata: Metadata = { title: "Content Hub — VIMOVE OS" };

export default async function ContentHubPage() {
  const session = await requirePermission("content.read");
  const canCreate = hasPermission(session, "content.create");

  const [board, campaigns, users] = await Promise.all([
    getContentBoard(session.user.organizationId),
    listCampaigns(session.user.organizationId),
    listUsers(session.user.organizationId),
  ]);

  const campaignOptions = campaigns.map((c) => ({ id: c.id, name: c.name }));
  const assigneeOptions = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  const total = Object.values(board).reduce((sum, items) => sum + items.length, 0);
  const inProgress = board.BRIEF.length + board.SCRIPT.length + board.PRODUCTION.length + board.REVIEW.length + board.APPROVED.length;

  return (
    <>
      <PageHeader
        title="Content Hub"
        description="Kéo thả để đổi giai đoạn nội dung"
        actions={canCreate ? <ContentDialog mode="create" campaigns={campaignOptions} assignees={assigneeOptions} action={createContentAction} /> : undefined}
      />

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Tổng nội dung" value={total} icon={FileEdit} tone="muted" />
          <KpiCard label="Đang sản xuất" value={inProgress} icon={Hourglass} tone={inProgress > 0 ? "primary" : "muted"} />
          <KpiCard label="Đã lên lịch" value={board.SCHEDULED.length} icon={CalendarClock} tone="muted" />
          <KpiCard label="Đã đăng" value={board.PUBLISHED.length} icon={Send} tone="muted" />
        </div>
      )}

      <ContentBoard board={board} onMove={moveContentStatusAction} contentBasePath="/marketing/content" />
    </>
  );
}
