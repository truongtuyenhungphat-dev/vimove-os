import type { Metadata } from "next";
import { Share2 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listSocialAccounts, listSocialPosts } from "@/services/marketing/social";
import { listContentOptions } from "@/services/marketing/content";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialAccountDialog } from "@/components/marketing/social-account-dialog";
import { SocialPostDialog } from "@/components/marketing/social-post-dialog";
import { SocialPostStatusSelect } from "@/components/marketing/social-post-status-select";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/marketing/types";
import { createSocialAccountAction, deleteSocialAccountAction, createSocialPostAction, updateSocialPostStatusAction, deleteSocialPostAction } from "./actions";

export const metadata: Metadata = { title: "Social — VIMOVE OS" };

export default async function SocialPage() {
  const session = await requirePermission("marketing_channels.read");
  const canManage = hasPermission(session, "marketing_channels.manage");

  const [accounts, posts, contents] = await Promise.all([
    listSocialAccounts(session.user.organizationId),
    listSocialPosts(session.user.organizationId),
    listContentOptions(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader title="Social" description="Tài khoản mạng xã hội & bài đăng — đăng thủ công, chưa nối OAuth thật" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tài khoản</CardTitle>
            {canManage && <SocialAccountDialog action={createSocialAccountAction} />}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {accounts.length === 0 ? (
              <EmptyState icon={Share2} title="Chưa có tài khoản nào" />
            ) : (
              accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{SOCIAL_PLATFORM_LABELS[a.platform]}{a.handle ? ` · ${a.handle}` : ""}</p>
                  </div>
                  {canManage && (
                    <ConfirmDeleteButton title="Xoá tài khoản" description={`Xoá tài khoản "${a.name}"?`} onConfirm={deleteSocialAccountAction.bind(null, a.id)} />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Bài đăng</CardTitle>
            {canManage && (
              <SocialPostDialog accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} contents={contents.map((c) => ({ id: c.id, name: c.title }))} action={createSocialPostAction} />
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {posts.length === 0 ? (
              <EmptyState icon={Share2} title="Chưa có bài đăng nào" />
            ) : (
              posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.caption}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.socialAccount.name} ({SOCIAL_PLATFORM_LABELS[p.socialAccount.platform]})
                      {p.content && ` · ${p.content.title}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {canManage ? (
                      <SocialPostStatusSelect postId={p.id} status={p.status} onChange={updateSocialPostStatusAction} />
                    ) : (
                      <Badge variant="outline" className="border-transparent bg-muted font-normal">
                        {p.status}
                      </Badge>
                    )}
                    {canManage && (
                      <ConfirmDeleteButton title="Xoá bài đăng" description="Xoá bài đăng này?" onConfirm={deleteSocialPostAction.bind(null, p.id)} />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
