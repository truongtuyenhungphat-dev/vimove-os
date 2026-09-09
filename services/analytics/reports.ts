import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { ReportDataset, ReportVisualization } from "@/lib/analytics/types";

export type ReportFilter = { field: string; value: string };

type Row = Record<string, string | number>;

/** Nạp dữ liệu thô cho từng dataset kèm quan hệ cần thiết để suy ra dimension —
 * Prisma `groupBy` không group được theo field của quan hệ (vd tên stage/owner), nên
 * lấy hết rồi tổng hợp ở tầng ứng dụng. Dữ liệu tổ chức thật, không giả lập. */
async function loadRows(organizationId: string, dataset: ReportDataset): Promise<Row[]> {
  switch (dataset) {
    case "LEADS": {
      const leads = await prisma.lead.findMany({
        where: { organizationId },
        include: { stage: { select: { name: true } }, owner: { select: { name: true } } },
      });
      return leads.map((l) => ({
        source: l.source,
        stageName: l.stage.name,
        ownerName: l.owner?.name ?? "Chưa gán",
        value: l.value === null ? 0 : Number(l.value),
      }));
    }
    case "ORDERS": {
      const orders = await prisma.order.findMany({
        where: { organizationId },
        include: { channel: { select: { name: true } } },
      });
      return orders.map((o) => ({
        status: o.status,
        channelName: o.channel?.name ?? "Không rõ kênh",
        totalAmount: Number(o.totalAmount),
      }));
    }
    case "CAMPAIGNS": {
      const campaigns = await prisma.campaign.findMany({ where: { organizationId } });
      return campaigns.map((c) => ({ status: c.status, budget: c.budget === null ? 0 : Number(c.budget) }));
    }
    case "CONTENT": {
      const contents = await prisma.content.findMany({ where: { organizationId } });
      return contents.map((c) => ({ type: c.type, status: c.status }));
    }
  }
}

function applyFilters(rows: Row[], filters: ReportFilter[]): Row[] {
  return rows.filter((row) => filters.every((f) => String(row[f.field] ?? "") === f.value));
}

function computeMetric(rows: Row[], metric: string): number {
  switch (metric) {
    case "count":
      return rows.length;
    case "totalValue":
      return rows.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    case "totalRevenue":
      return rows.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    case "totalBudget":
      return rows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
    default:
      return 0;
  }
}

/** Chạy 1 widget: Dataset→Dimension→Metric→Filter→Grouping — trả về mảng
 * {dimensionValue, metricValue} thật, tính trực tiếp trên dữ liệu tổ chức. */
export async function runReportWidget(
  organizationId: string,
  config: { dataset: ReportDataset; dimension: string; metric: string; filters?: ReportFilter[] }
) {
  const allRows = await loadRows(organizationId, config.dataset);
  const rows = config.filters && config.filters.length > 0 ? applyFilters(allRows, config.filters) : allRows;

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = String(row[config.dimension] ?? "(khác)");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries())
    .map(([dimensionValue, groupRows]) => ({ dimensionValue, metricValue: computeMetric(groupRows, config.metric) }))
    .sort((a, b) => b.metricValue - a.metricValue);
}

export async function listReports(organizationId: string) {
  return prisma.report.findMany({
    where: { organizationId },
    include: { createdBy: { select: { id: true, name: true } }, _count: { select: { widgets: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReport(organizationId: string, id: string) {
  return prisma.report.findFirst({
    where: { id, organizationId },
    include: { widgets: { orderBy: { position: "asc" } } },
  });
}

export async function createReport(organizationId: string, actorId: string, data: { name: string; description?: string | null }) {
  const report = await prisma.report.create({ data: { organizationId, name: data.name, description: data.description || null, createdById: actorId } });
  await writeAuditLog({ organizationId, actorId, action: "report.create", entityType: "Report", entityId: report.id, after: { name: report.name } });
  return report;
}

export async function deleteReport(organizationId: string, actorId: string, id: string) {
  const before = await prisma.report.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy report");
  await prisma.report.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "report.delete", entityType: "Report", entityId: id, before: { name: before.name } });
}

export async function addWidget(
  organizationId: string,
  reportId: string,
  data: { dataset: ReportDataset; dimension: string; metric: string; visualization: ReportVisualization; filters?: ReportFilter[] }
) {
  const report = await prisma.report.findFirst({ where: { id: reportId, organizationId } });
  if (!report) throw new Error("Không tìm thấy report");
  const last = await prisma.reportWidget.findFirst({ where: { reportId }, orderBy: { position: "desc" } });
  return prisma.reportWidget.create({
    data: {
      reportId,
      dataset: data.dataset,
      dimension: data.dimension,
      metric: data.metric,
      visualization: data.visualization,
      filters: data.filters && data.filters.length > 0 ? (data.filters as object) : undefined,
      position: (last?.position ?? -1) + 1,
    },
  });
}

export async function removeWidget(organizationId: string, widgetId: string) {
  const widget = await prisma.reportWidget.findFirst({ where: { id: widgetId, report: { organizationId } } });
  if (!widget) throw new Error("Không tìm thấy widget");
  await prisma.reportWidget.delete({ where: { id: widgetId } });
}

/** Export CSV thật — không phụ thuộc thư viện ngoài. XLSX/PDF: xem docs/07-analytics.md
 * (quyết định hoãn, nút disabled rõ ràng thay vì giả vờ hoạt động). */
export function toCsv(rows: { dimensionValue: string; metricValue: number }[], dimensionLabel: string, metricLabel: string): string {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [`${escape(dimensionLabel)},${escape(metricLabel)}`, ...rows.map((r) => `${escape(r.dimensionValue)},${r.metricValue}`)];
  return lines.join("\n");
}
