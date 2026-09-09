import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getReport, runReportWidget } from "@/services/analytics/reports";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { WidgetDialog } from "@/components/analytics/widget-dialog";
import { WidgetCard } from "@/components/analytics/widget-card";
import { BarChart3 } from "lucide-react";
import { addWidgetAction, removeWidgetAction, exportWidgetCsvAction, deleteReportAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết report — VIMOVE OS" };

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const session = await requirePermission("analytics.read");
  const { reportId } = await params;
  const report = await getReport(session.user.organizationId, reportId);
  if (!report) notFound();

  const canManage = hasPermission(session, "analytics.manage");
  const widgetsWithData = await Promise.all(
    report.widgets.map(async (w) => ({
      widget: w,
      rows: await runReportWidget(session.user.organizationId, {
        dataset: w.dataset,
        dimension: w.dimension,
        metric: w.metric,
        filters: (w.filters as { field: string; value: string }[] | null) ?? undefined,
      }),
    }))
  );

  return (
    <>
      <PageHeader
        title={report.name}
        description={report.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {canManage && <WidgetDialog action={addWidgetAction.bind(null, report.id)} />}
            {canManage && (
              <ConfirmDeleteButton title="Xoá report" description={`Xoá report "${report.name}" — không thể hoàn tác.`} onConfirm={deleteReportAction.bind(null, report.id)} />
            )}
          </div>
        }
      />

      {widgetsWithData.length === 0 ? (
        <EmptyState icon={BarChart3} title="Chưa có widget nào" description="Thêm widget để bắt đầu xem số liệu." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {widgetsWithData.map(({ widget, rows }) => (
            <WidgetCard
              key={widget.id}
              widgetId={widget.id}
              dataset={widget.dataset}
              dimension={widget.dimension}
              metric={widget.metric}
              visualization={widget.visualization}
              rows={rows}
              canManage={canManage}
              onExportCsv={exportWidgetCsvAction.bind(null, report.id)}
              onRemove={removeWidgetAction.bind(null, report.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
