import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Play, Wallet, TrendingUp, Target } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listCampaigns } from "@/services/marketing/campaigns";
import { listProjects } from "@/services/projects/projects";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignDialog } from "@/components/marketing/campaign-dialog";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/marketing/types";
import { createCampaignAction } from "./actions";

export const metadata: Metadata = { title: "Chiến dịch — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PAUSED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export default async function CampaignsPage() {
  const session = await requirePermission("campaigns.read");
  const canCreate = hasPermission(session, "campaigns.create");

  const [campaigns, projects] = await Promise.all([
    listCampaigns(session.user.organizationId),
    listProjects(session.user.organizationId),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.kpis.revenue, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.kpis.leads, 0);
  const totalProfit = campaigns.reduce((sum, c) => sum + c.kpis.profit, 0);

  return (
    <>
      <PageHeader
        title="Chiến dịch"
        description="Spend/Revenue/ROAS/Leads/CPL/Orders/CAC/Profit tính theo dữ liệu thật (Spend = 0 tới khi nối Ads ở Phase 6)"
        actions={canCreate ? <CampaignDialog mode="create" projects={projects.map((p) => ({ id: p.id, name: p.name }))} action={createCampaignAction} /> : undefined}
      />

      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Đang chạy" value={activeCampaigns} icon={Play} tone={activeCampaigns > 0 ? "primary" : "muted"} hint={`/ ${campaigns.length} chiến dịch`} />
          <KpiCard label="Tổng Revenue quy về" value={formatVnd(totalRevenue)} icon={Wallet} tone="primary" />
          <KpiCard label="Tổng lead" value={totalLeads} icon={Target} tone="muted" />
          <KpiCard label="Tổng Profit" value={formatVnd(totalProfit)} icon={TrendingUp} tone={totalProfit >= 0 ? "primary" : "muted"} />
        </div>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {campaigns.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Megaphone} title="Chưa có chiến dịch nào" description="Tạo chiến dịch đầu tiên để bắt đầu theo dõi Content Hub và KPI." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chiến dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>CPL</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>CAC</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/marketing/campaigns/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      {c.project && <p className="text-xs text-muted-foreground">Dự án: {c.project.name}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[c.status]}`}>
                        {CAMPAIGN_STATUS_LABELS[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatVnd(c.kpis.spend)}</TableCell>
                    <TableCell>{formatVnd(c.kpis.revenue)}</TableCell>
                    <TableCell>{c.kpis.roas.toFixed(2)}x</TableCell>
                    <TableCell>{c.kpis.leads}</TableCell>
                    <TableCell>{formatVnd(c.kpis.cpl)}</TableCell>
                    <TableCell>{c.kpis.orders}</TableCell>
                    <TableCell>{formatVnd(c.kpis.cac)}</TableCell>
                    <TableCell className={c.kpis.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                      {formatVnd(c.kpis.profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
