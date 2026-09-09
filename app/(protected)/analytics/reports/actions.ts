"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission, requirePermission } from "@/lib/auth/rbac";
import { createReport, deleteReport, addWidget, removeWidget, runReportWidget, toCsv, getReport } from "@/services/analytics/reports";
import { DATASET_DIMENSIONS, DATASET_METRICS } from "@/lib/analytics/types";

export async function createReportAction(formData: FormData) {
  const session = await assertPermission("analytics.manage");
  const parsed = z.object({ name: z.string().trim().min(1, "Cần nhập tên report"), description: z.string().trim().optional() }).parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  await createReport(session.user.organizationId, session.user.id, { name: parsed.name, description: parsed.description || null });
  revalidatePath("/analytics/reports");
}

export async function deleteReportAction(reportId: string) {
  const session = await assertPermission("analytics.manage");
  await deleteReport(session.user.organizationId, session.user.id, reportId);
  revalidatePath("/analytics/reports");
}

const widgetSchema = z.object({
  dataset: z.enum(["LEADS", "ORDERS", "CAMPAIGNS", "CONTENT"]),
  dimension: z.string().min(1),
  metric: z.string().min(1),
  visualization: z.enum(["TABLE", "BAR", "LINE", "PIE"]),
});

export async function addWidgetAction(reportId: string, formData: FormData) {
  const session = await assertPermission("analytics.manage");
  const parsed = widgetSchema.parse({
    dataset: formData.get("dataset"),
    dimension: formData.get("dimension"),
    metric: formData.get("metric"),
    visualization: formData.get("visualization"),
  });
  await addWidget(session.user.organizationId, reportId, parsed);
  revalidatePath(`/analytics/reports/${reportId}`);
}

export async function removeWidgetAction(reportId: string, widgetId: string) {
  const session = await assertPermission("analytics.manage");
  await removeWidget(session.user.organizationId, widgetId);
  revalidatePath(`/analytics/reports/${reportId}`);
}

export async function exportWidgetCsvAction(reportId: string, widgetId: string): Promise<string> {
  const session = await requirePermission("analytics.read");
  const report = await getReport(session.user.organizationId, reportId);
  const widget = report?.widgets.find((w) => w.id === widgetId);
  if (!widget) throw new Error("Không tìm thấy widget");
  const rows = await runReportWidget(session.user.organizationId, {
    dataset: widget.dataset,
    dimension: widget.dimension,
    metric: widget.metric,
    filters: (widget.filters as { field: string; value: string }[] | null) ?? undefined,
  });
  const dimensionLabel = DATASET_DIMENSIONS[widget.dataset].find((d) => d.value === widget.dimension)?.label ?? widget.dimension;
  const metricLabel = DATASET_METRICS[widget.dataset].find((m) => m.value === widget.metric)?.label ?? widget.metric;
  return toCsv(rows, dimensionLabel, metricLabel);
}
