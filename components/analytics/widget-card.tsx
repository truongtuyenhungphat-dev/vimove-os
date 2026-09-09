"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { REPORT_DATASET_LABELS, DATASET_DIMENSIONS, DATASET_METRICS, type ReportDataset, type ReportVisualization } from "@/lib/analytics/types";

export type WidgetRow = { dimensionValue: string; metricValue: number };

export function WidgetCard({
  widgetId,
  dataset,
  dimension,
  metric,
  visualization,
  rows,
  canManage,
  onExportCsv,
  onRemove,
}: {
  widgetId: string;
  dataset: ReportDataset;
  dimension: string;
  metric: string;
  visualization: ReportVisualization;
  rows: WidgetRow[];
  canManage: boolean;
  onExportCsv: (widgetId: string) => Promise<string>;
  onRemove: (widgetId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const dimensionLabel = DATASET_DIMENSIONS[dataset].find((d) => d.value === dimension)?.label ?? dimension;
  const metricLabel = DATASET_METRICS[dataset].find((m) => m.value === metric)?.label ?? metric;
  const max = Math.max(...rows.map((r) => r.metricValue), 1);

  function handleExport() {
    startTransition(async () => {
      try {
        const csv = await onExportCsv(widgetId);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dimensionLabel}-${metricLabel}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {REPORT_DATASET_LABELS[dataset]} · {dimensionLabel} → {metricLabel}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon-sm" variant="ghost" disabled={isPending} onClick={handleExport} aria-label="Xuất CSV">
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
          </Button>
          {canManage && <ConfirmDeleteButton title="Xoá widget" description="Xoá widget này khỏi report?" onConfirm={() => onRemove(widgetId)} />}
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : visualization === "BAR" ? (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.dimensionValue} className="flex items-center gap-2 text-sm">
                <span className="w-32 shrink-0 truncate">{r.dimensionValue}</span>
                <div className="h-4 flex-1 rounded bg-muted">
                  <div className="h-4 rounded bg-primary" style={{ width: `${(r.metricValue / max) * 100}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums">{r.metricValue.toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 font-medium">{dimensionLabel}</th>
                <th className="py-1.5 text-right font-medium">{metricLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dimensionValue} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5">{r.dimensionValue}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.metricValue.toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
