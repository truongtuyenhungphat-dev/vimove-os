import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getContentBoard } from "@/services/marketing/content";
import { listCampaigns } from "@/services/marketing/campaigns";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
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

  return (
    <>
      <PageHeader
        title="Content Hub"
        description="Kéo thả để đổi giai đoạn nội dung"
        actions={canCreate ? <ContentDialog mode="create" campaigns={campaignOptions} assignees={assigneeOptions} action={createContentAction} /> : undefined}
      />

      <ContentBoard board={board} onMove={moveContentStatusAction} contentBasePath="/marketing/content" />
    </>
  );
}
