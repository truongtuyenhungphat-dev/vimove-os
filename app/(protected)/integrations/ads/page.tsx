import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listConnections } from "@/services/ads/connections";
import { listAdAccountSummaries } from "@/services/ads/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConnectionCard } from "@/components/ads/connection-card";
import { AD_PLATFORM_LABELS } from "@/lib/ads/types";
import { BarChart3 } from "lucide-react";
import { startConnectAction, disconnectAction, syncAction } from "./actions";

export const metadata: Metadata = { title: "Tích hợp quảng cáo — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function AdsIntegrationPage() {
  const session = await requirePermission("ads.read");
  const canManage = hasPermission(session, "ads.manage");

  const [connections, summaries] = await Promise.all([
    listConnections(session.user.organizationId),
    listAdAccountSummaries(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Tích hợp quảng cáo"
        description="Kết nối Meta/Google/TikTok/Zalo Ads — cần app credential thật trước khi kết nối được (xem docs/06-ads-integration.md)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connections.map((c) => (
          <ConnectionCard
            key={c.platform}
            data={{
              ...c,
              connection: c.connection
                ? { ...c.connection, lastSyncedAt: c.connection.lastSyncedAt?.toISOString() ?? null }
                : null,
            }}
            canManage={canManage}
            onConnect={startConnectAction}
            onDisconnect={disconnectAction}
            onSync={syncAction}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {summaries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={BarChart3}
                title="Chưa có dữ liệu quảng cáo"
                description="Số liệu sẽ hiện ở đây sau khi kết nối tài khoản và đồng bộ thành công."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead>Nền tảng</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>CPM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{AD_PLATFORM_LABELS[s.platform]}</TableCell>
                    <TableCell>{s.metrics.impressions.toLocaleString("vi-VN")}</TableCell>
                    <TableCell>{s.metrics.clicks.toLocaleString("vi-VN")}</TableCell>
                    <TableCell>{s.metrics.ctr.toFixed(2)}%</TableCell>
                    <TableCell>{formatVnd(s.metrics.spend)}</TableCell>
                    <TableCell>{formatVnd(s.metrics.cpc)}</TableCell>
                    <TableCell>{formatVnd(s.metrics.cpm)}</TableCell>
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
