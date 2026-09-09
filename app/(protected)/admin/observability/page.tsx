import type { Metadata } from "next";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { requirePermission } from "@/lib/auth/rbac";
import { listErrorLogs, getErrorLogStats } from "@/services/core/observability";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorLogRow } from "./error-log-row";

export const metadata: Metadata = { title: "Observability — VIMOVE OS" };

export default async function ObservabilityPage() {
  const session = await requirePermission("observability.read");

  const [logs, stats] = await Promise.all([
    listErrorLogs(session.user.organizationId),
    getErrorLogStats(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Observability"
        description="Nhật ký lỗi thật ghi từ Server Action/Route Handler/React error boundary — không phụ thuộc dịch vụ ngoài (Sentry...)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Tổng số lỗi đã ghi" value={stats.total} icon={ShieldAlert} tone="muted" />
        <KpiCard label="Lỗi trong 24 giờ qua" value={stats.last24h} icon={AlertTriangle} tone={stats.last24h > 0 ? "primary" : "muted"} />
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ShieldAlert} title="Chưa ghi nhận lỗi nào" description="Đây là dấu hiệu tốt — hệ thống chưa gặp lỗi thật nào kể từ khi bật observability." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <ErrorLogRow
                  key={log.id}
                  message={log.message}
                  path={log.path}
                  stack={log.stack}
                  timeLabel={formatDistanceToNow(log.createdAt, { addSuffix: true, locale: vi })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
