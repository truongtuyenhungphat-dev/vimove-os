import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getContent } from "@/services/marketing/content";
import { listCampaigns } from "@/services/marketing/campaigns";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentDialog } from "@/components/marketing/content-dialog";
import { ContentAssetsPanel } from "@/components/marketing/content-assets-panel";
import { CONTENT_TYPE_LABELS, CONTENT_STATUS_LABELS, SOCIAL_PLATFORM_LABELS, SOCIAL_POST_STATUS_LABELS } from "@/lib/marketing/types";
import { updateContentAction, deleteContentAction, addAssetAction, removeAssetAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết nội dung — VIMOVE OS" };

export default async function ContentDetailPage({ params }: { params: Promise<{ contentId: string }> }) {
  const session = await requirePermission("content.read");
  const { contentId } = await params;
  const content = await getContent(session.user.organizationId, contentId);
  if (!content) notFound();

  const canUpdate = hasPermission(session, "content.update");
  const canDelete = hasPermission(session, "content.delete");
  const [campaigns, users] = await Promise.all([listCampaigns(session.user.organizationId), listUsers(session.user.organizationId)]);

  return (
    <>
      <PageHeader
        title={content.title}
        description={`${CONTENT_TYPE_LABELS[content.type]} · Tạo bởi ${content.createdBy.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-transparent bg-primary/10 font-normal text-primary">
              {CONTENT_STATUS_LABELS[content.status]}
            </Badge>
            {canUpdate && (
              <ContentDialog
                mode="edit"
                content={{ id: content.id, title: content.title, type: content.type, campaignId: content.campaignId, assigneeId: content.assigneeId, body: content.body }}
                campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
                assignees={users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }))}
                action={updateContentAction.bind(null, content.id)}
              />
            )}
            {canDelete && (
              <ConfirmDeleteButton title="Xoá nội dung" description={`Xoá nội dung "${content.title}" — không thể hoàn tác.`} onConfirm={deleteContentAction.bind(null, content.id)} />
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {content.body && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brief / Mô tả</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{content.body}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tài nguyên</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentAssetsPanel
                assets={content.assets}
                canEdit={canUpdate}
                onAdd={addAssetAction.bind(null, content.id)}
                onRemove={removeAssetAction.bind(null, content.id)}
              />
            </CardContent>
          </Card>

          {content.socialPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bài đăng liên kết</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {content.socialPosts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                    <span>{SOCIAL_PLATFORM_LABELS[p.socialAccount.platform]} · {p.socialAccount.name}</span>
                    <Badge variant="outline" className="border-transparent bg-muted font-normal">
                      {SOCIAL_POST_STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 text-sm">
            {content.campaign && (
              <div>
                <p className="text-muted-foreground">Chiến dịch</p>
                <Link href={`/marketing/campaigns/${content.campaign.id}`} className="font-medium text-primary hover:underline">
                  {content.campaign.name}
                </Link>
              </div>
            )}
            {content.assignee && (
              <div>
                <p className="text-muted-foreground">Người phụ trách</p>
                <p>{content.assignee.name}</p>
              </div>
            )}
            {content.publishedAt && (
              <div>
                <p className="text-muted-foreground">Đã đăng lúc</p>
                <p>{new Date(content.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
