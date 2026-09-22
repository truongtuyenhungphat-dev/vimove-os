import type { Metadata } from "next";
import Link from "next/link";
import { Users, Eye, Video, TrendingUp, Download } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listTrackedChannels } from "@/services/channel-tracking/channels";
import { getScrapeStatus } from "@/services/channel-tracking/apify";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelTable } from "@/components/channel-tracking/channel-table";
import { AddChannelDialog } from "@/components/channel-tracking/add-channel-dialog";
import { ScrapePanel } from "@/components/channel-tracking/scrape-panel";
import { Sparkline } from "@/components/channel-tracking/sparkline";
import { PLATFORM_LABEL, fmtNumber, type Platform } from "@/lib/channel-tracking/types";
import { addChannelAction, updateChannelAction, deleteChannelAction, scrapeNowAction, updatePlatformConfigAction } from "./actions";

export const metadata: Metadata = { title: "Theo dõi kênh — VIMOVE OS" };

export default async function ChannelTrackingPage() {
  const session = await requirePermission("channel_tracking.read");
  const canCreate = hasPermission(session, "channel_tracking.create");
  const canUpdate = hasPermission(session, "channel_tracking.update");
  const canDelete = hasPermission(session, "channel_tracking.delete");
  const orgId = session.user.organizationId;

  const [channels, scrapeStatus] = await Promise.all([listTrackedChannels(orgId), getScrapeStatus(orgId)]);

  const active = channels.filter((c) => c.status !== "REMOVED");
  const totalFollowers = active.reduce((s, c) => s + (c.followers ?? 0), 0);
  const totalViews = active.reduce((s, c) => s + (c.totalViews ?? 0), 0);
  const followersDelta7d = active.reduce((s, c) => s + (c.followersDelta7d ?? 0), 0);

  const byPlatform = (["TIKTOK", "YOUTUBE", "FACEBOOK", "INSTAGRAM"] as Platform[]).map((p) => {
    const list = active.filter((c) => c.platform === p);
    return { platform: p, count: list.length, followers: list.reduce((s, c) => s + (c.followers ?? 0), 0) };
  });

  const topGrowers = [...active]
    .filter((c) => c.followersDelta7d != null)
    .sort((a, b) => (b.followersDelta7d ?? 0) - (a.followersDelta7d ?? 0))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Theo dõi kênh"
        description="Follower/view/video/tương tác của kênh TikTok/YouTube/Facebook/Instagram, quét tự động mỗi ngày qua Apify"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/marketing/channel-tracking/export" />}>
              <Download /> Xuất Excel
            </Button>
            {canCreate && <AddChannelDialog action={addChannelAction} />}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tổng follower" value={fmtNumber(totalFollowers)} icon={Users} tone="primary" />
        <KpiCard label="Tổng view" value={fmtNumber(totalViews)} icon={Eye} tone="muted" />
        <KpiCard label="Kênh đang theo dõi" value={active.length} icon={Video} tone="muted" />
        <KpiCard
          label="Follower tăng (7 ngày)"
          value={`${followersDelta7d > 0 ? "+" : ""}${fmtNumber(followersDelta7d)}`}
          icon={TrendingUp}
          tone={followersDelta7d > 0 ? "primary" : "muted"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="channels">Kênh ({active.length})</TabsTrigger>
          <TabsTrigger value="scrape">Quét & Apify</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {byPlatform.map((p) => (
              <Card key={p.platform}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">{PLATFORM_LABEL[p.platform]}</p>
                  <p className="mt-1 text-2xl font-semibold">{fmtNumber(p.followers)}</p>
                  <p className="text-xs text-muted-foreground">{p.count} kênh</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Tăng trưởng follower nhiều nhất (7 ngày)</h3>
            {topGrowers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu — cần ít nhất 2 ngày quét.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topGrowers.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {PLATFORM_LABEL[c.platform as Platform]} · @{c.username}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.label || "—"}</p>
                      </div>
                      <Sparkline points={c.followersSeries} />
                      <p className={`text-sm font-semibold tabular-nums ${(c.followersDelta7d ?? 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {(c.followersDelta7d ?? 0) > 0 ? "+" : ""}
                        {fmtNumber(c.followersDelta7d)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <ChannelTable channels={channels} canUpdate={canUpdate} canDelete={canDelete} updateAction={updateChannelAction} deleteAction={deleteChannelAction} />
        </TabsContent>

        <TabsContent value="scrape" className="mt-4">
          <ScrapePanel status={scrapeStatus} canUpdate={canUpdate} scrapeNowAction={scrapeNowAction} updatePlatformConfigAction={updatePlatformConfigAction} />
        </TabsContent>
      </Tabs>
    </>
  );
}
