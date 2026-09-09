import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getExecutiveSummary, getWorkSummary, getContentSummary, getSalesSummary } from "@/services/analytics/domain-summaries";
import { listCampaigns } from "@/services/marketing/campaigns";
import { listAttributionSummary } from "@/services/analytics/attribution";
import { listAdAccountSummaries } from "@/services/ads/dashboard";
import { listDailyMetrics } from "@/services/analytics/daily-metrics";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkline } from "@/components/analytics/sparkline";
import { RecomputeButton } from "@/components/analytics/recompute-button";
import { AD_PLATFORM_LABELS } from "@/lib/ads/types";
import { Users, Target, Trophy, Wallet, ListTodo, AlertTriangle, FileEdit, ShoppingCart, Megaphone, BarChart3 } from "lucide-react";
import { recomputeDailyMetricsAction } from "./actions";

export const metadata: Metadata = { title: "Analytics — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function AnalyticsPage() {
  const session = await requirePermission("analytics.read");
  const canManage = hasPermission(session, "analytics.manage");
  const organizationId = session.user.organizationId;

  const [executive, work, content, sales, campaigns, attribution, adAccounts, dailyMetrics] = await Promise.all([
    getExecutiveSummary(organizationId),
    getWorkSummary(organizationId),
    getContentSummary(organizationId),
    getSalesSummary(organizationId),
    listCampaigns(organizationId),
    listAttributionSummary(organizationId),
    listAdAccountSummaries(organizationId),
    listDailyMetrics(organizationId, 30),
  ]);

  const totalCampaignRevenue = campaigns.reduce((sum, c) => sum + c.kpis.revenue, 0);
  const totalCampaignSpend = campaigns.reduce((sum, c) => sum + c.kpis.spend, 0);
  const totalAdsSpend = adAccounts.reduce((sum, a) => sum + a.metrics.spend, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Executive / Work / Marketing / Ads / Sales / Content — tính trên dữ liệu thật của tổ chức"
        actions={canManage ? <RecomputeButton action={recomputeDailyMetricsAction} /> : undefined}
      />

      <Tabs defaultValue="executive">
        <TabsList>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Người dùng đang hoạt động" value={executive.activeUsers} icon={Users} />
            <KpiCard label="Tổng lead" value={executive.leadCount} icon={Target} />
            <KpiCard label="Tỷ lệ thắng" value={`${executive.winRate.toFixed(1)}%`} icon={Trophy} />
            <KpiCard label="Giá trị pipeline đang mở" value={formatVnd(executive.openPipelineValue)} icon={Wallet} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Doanh thu 30 ngày gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <Sparkline data={dailyMetrics.map((d) => d.revenue)} />
              <p className="mt-2 text-xs text-muted-foreground">
                Tổng: {formatVnd(dailyMetrics.reduce((s, d) => s + d.revenue, 0))} · {dailyMetrics.reduce((s, d) => s + d.leads, 0)} lead mới ·{" "}
                {dailyMetrics.reduce((s, d) => s + d.orders, 0)} đơn hàng
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Tổng công việc" value={work.total} icon={ListTodo} />
            <KpiCard label="Đã hoàn thành" value={work.done} icon={ListTodo} />
            <KpiCard label="Tỷ lệ hoàn thành" value={`${work.completionRate.toFixed(1)}%`} icon={ListTodo} />
            <KpiCard label="Quá hạn" value={work.overdue} icon={AlertTriangle} tone={work.overdue > 0 ? "primary" : "muted"} />
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Chiến dịch" value={campaigns.length} icon={Megaphone} />
            <KpiCard label="Tổng Revenue quy về" value={formatVnd(totalCampaignRevenue)} icon={Wallet} />
            <KpiCard label="Tổng Spend" value={formatVnd(totalCampaignSpend)} icon={Wallet} hint="Chưa nối Ads (Phase 6)" />
            <KpiCard label="Profit" value={formatVnd(totalCampaignRevenue - totalCampaignSpend)} icon={Wallet} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chuyển đổi theo nguồn UTM (first-touch)</CardTitle>
            </CardHeader>
            <CardContent>
              {attribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu attribution (chưa có lượt chuyển đổi từ landing page).</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {attribution.map((a) => (
                    <div key={a.source} className="flex items-center justify-between text-sm">
                      <span>{a.source}</span>
                      <span className="font-medium">{a.conversions}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Tài khoản quảng cáo" value={adAccounts.length} icon={BarChart3} />
            <KpiCard label="Tổng Spend" value={formatVnd(totalAdsSpend)} icon={Wallet} hint="Chưa nối Ads (Phase 6)" />
            <KpiCard label="Impressions" value={adAccounts.reduce((s, a) => s + a.metrics.impressions, 0)} icon={BarChart3} />
            <KpiCard label="Clicks" value={adAccounts.reduce((s, a) => s + a.metrics.clicks, 0)} icon={BarChart3} />
          </div>
          {adAccounts.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-6">
                {adAccounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span>
                      {a.name} ({AD_PLATFORM_LABELS[a.platform]})
                    </span>
                    <span>{formatVnd(a.metrics.spend)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Đơn hàng" value={sales.orderCount} icon={ShoppingCart} />
            <KpiCard label="Tổng doanh thu" value={formatVnd(sales.totalRevenue)} icon={Wallet} />
            <KpiCard label="AOV (giá trị đơn TB)" value={formatVnd(sales.aov)} icon={Wallet} />
            <KpiCard label="Khách hàng" value={sales.customerCount} icon={Users} />
          </div>
        </TabsContent>

        <TabsContent value="content" className="flex flex-col gap-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Tổng nội dung" value={content.total} icon={FileEdit} />
            <KpiCard label="Đã đăng" value={content.published} icon={FileEdit} />
          </div>
          <Card>
            <CardContent className="flex flex-col gap-1.5 pt-6 text-sm">
              {content.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span>{s.status}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
