import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, TrendingUp, Target, ShoppingCart } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getCampaign } from "@/services/marketing/campaigns";
import { listProjects } from "@/services/projects/projects";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignDialog } from "@/components/marketing/campaign-dialog";
import { AddChannelForm } from "@/components/marketing/add-channel-form";
import { CAMPAIGN_STATUS_LABELS, MARKETING_CHANNEL_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/lib/marketing/types";
import { updateCampaignAction, deleteCampaignAction, addChannelAction, removeChannelAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết chiến dịch — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const session = await requirePermission("campaigns.read");
  const { campaignId } = await params;
  const campaign = await getCampaign(session.user.organizationId, campaignId);
  if (!campaign) notFound();

  const canUpdate = hasPermission(session, "campaigns.update");
  const canDelete = hasPermission(session, "campaigns.delete");
  const projects = await listProjects(session.user.organizationId);

  return (
    <>
      <PageHeader
        title={campaign.name}
        description={campaign.project ? `Dự án: ${campaign.project.name}` : "Không thuộc dự án nào"}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-transparent bg-primary/10 font-normal text-primary">
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
            {canUpdate && (
              <CampaignDialog
                mode="edit"
                campaign={{
                  id: campaign.id,
                  name: campaign.name,
                  description: campaign.description,
                  status: campaign.status,
                  projectId: campaign.projectId,
                  budget: campaign.budget,
                  startAt: campaign.startAt?.toISOString().slice(0, 10) ?? null,
                  endAt: campaign.endAt?.toISOString().slice(0, 10) ?? null,
                }}
                projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                action={updateCampaignAction.bind(null, campaign.id)}
              />
            )}
            {canDelete && (
              <ConfirmDeleteButton title="Xoá chiến dịch" description={`Xoá chiến dịch "${campaign.name}" — không thể hoàn tác.`} onConfirm={deleteCampaignAction.bind(null, campaign.id)} />
            )}
          </div>
        }
      />

      {campaign.description && <p className="text-sm text-muted-foreground">{campaign.description}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Spend" value={formatVnd(campaign.kpis.spend)} icon={Wallet} hint="Chưa nối Ads (Phase 6)" />
        <KpiCard label="Revenue" value={formatVnd(campaign.kpis.revenue)} icon={TrendingUp} />
        <KpiCard label="ROAS" value={`${campaign.kpis.roas.toFixed(2)}x`} icon={TrendingUp} />
        <KpiCard label="Profit" value={formatVnd(campaign.kpis.profit)} icon={Wallet} tone={campaign.kpis.profit >= 0 ? "primary" : "muted"} />
        <KpiCard label="Leads" value={campaign.kpis.leads} icon={Target} />
        <KpiCard label="CPL" value={formatVnd(campaign.kpis.cpl)} icon={Target} />
        <KpiCard label="Orders" value={campaign.kpis.orders} icon={ShoppingCart} />
        <KpiCard label="CAC" value={formatVnd(campaign.kpis.cac)} icon={ShoppingCart} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kênh trong chiến dịch</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {campaign.channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có kênh nào.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {campaign.channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                    <div>
                      <p className="font-medium">{MARKETING_CHANNEL_TYPE_LABELS[ch.type]}</p>
                      {ch.plannedBudget !== null && <p className="text-xs text-muted-foreground">Ngân sách dự kiến: {formatVnd(ch.plannedBudget)}</p>}
                    </div>
                    {canUpdate && (
                      <ConfirmDeleteButton
                        title="Xoá kênh"
                        description="Xoá kênh này khỏi chiến dịch?"
                        onConfirm={removeChannelAction.bind(null, campaign.id, ch.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {canUpdate && <AddChannelForm action={addChannelAction.bind(null, campaign.id)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung liên kết ({campaign.contents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.contents.length === 0 ? (
              <EmptyState icon={Target} title="Chưa có nội dung nào" />
            ) : (
              <div className="flex flex-col gap-2">
                {campaign.contents.map((c) => (
                  <Link key={c.id} href={`/marketing/content/${c.id}`} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm hover:bg-accent">
                    <span className="font-medium">{c.title}</span>
                    <Badge variant="outline" className="border-transparent bg-muted font-normal">
                      {CONTENT_STATUS_LABELS[c.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead quy về chiến dịch ({campaign.leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.leads.length === 0 ? (
            <EmptyState icon={Target} title="Chưa có lead nào quy về chiến dịch này" />
          ) : (
            <div className="flex flex-col gap-2">
              {campaign.leads.map((l) => (
                <Link key={l.id} href={`/crm/leads/${l.id}`} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm hover:bg-accent">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.stage.name}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
