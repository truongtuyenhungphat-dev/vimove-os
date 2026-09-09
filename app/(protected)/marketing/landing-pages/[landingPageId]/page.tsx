import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getLandingPage, listSubmissions } from "@/services/marketing/landing-pages";
import { listCampaigns } from "@/services/marketing/campaigns";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingPageDialog } from "@/components/marketing/landing-page-dialog";
import { LANDING_PAGE_STATUS_LABELS } from "@/lib/marketing/types";
import { updateLandingPageAction, deleteLandingPageAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết Landing Page — VIMOVE OS" };

export default async function LandingPageDetailPage({ params }: { params: Promise<{ landingPageId: string }> }) {
  const session = await requirePermission("marketing_channels.read");
  const { landingPageId } = await params;
  const page = await getLandingPage(session.user.organizationId, landingPageId);
  if (!page) notFound();

  const canManage = hasPermission(session, "marketing_channels.manage");
  const campaigns = await listCampaigns(session.user.organizationId);
  const form = page.forms[0];
  const submissions = form ? await listSubmissions(form.id) : [];

  return (
    <>
      <PageHeader
        title={page.name}
        description={`/lp/${page.slug}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-transparent bg-primary/10 font-normal text-primary">
              {LANDING_PAGE_STATUS_LABELS[page.status]}
            </Badge>
            {page.status === "PUBLISHED" && (
              <a href={`/lp/${page.slug}`} target="_blank" rel="noreferrer">
                <Badge variant="outline" className="flex items-center gap-1 border-transparent bg-muted font-normal">
                  Xem trang <ExternalLink className="size-3" />
                </Badge>
              </a>
            )}
            {canManage && (
              <LandingPageDialog
                mode="edit"
                page={{
                  id: page.id,
                  name: page.name,
                  slug: page.slug,
                  status: page.status,
                  campaignId: page.campaignId,
                  headline: page.headline,
                  body: page.body,
                  ctaLabel: page.ctaLabel,
                  ctaUrl: page.ctaUrl,
                }}
                campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
                action={updateLandingPageAction.bind(null, page.id)}
              />
            )}
            {canManage && (
              <ConfirmDeleteButton title="Xoá landing page" description={`Xoá "${page.name}" — không thể hoàn tác.`} onConfirm={deleteLandingPageAction.bind(null, page.id)} />
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{page.headline}</CardTitle>
        </CardHeader>
        {page.body && <CardContent className="text-sm text-muted-foreground">{page.body}</CardContent>}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đăng ký ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <EmptyState icon={ExternalLink} title="Chưa có lượt đăng ký nào" description="Chia sẻ link trang công khai để bắt đầu thu lead." />
          ) : (
            <div className="flex flex-col gap-2">
              {submissions.map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-2 text-sm">
                  <p className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString("vi-VN")}</p>
                  <p>{Object.entries(s.data as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
