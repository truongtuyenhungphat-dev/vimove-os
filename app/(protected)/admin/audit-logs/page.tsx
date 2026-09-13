import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { requirePermission } from "@/lib/auth/rbac";
import { listAuditLogs } from "@/services/core/audit";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogTable } from "./audit-log-table";

export const metadata: Metadata = { title: "Nhật ký Audit — VIMOVE OS" };

export default async function AuditLogsPage() {
  const session = await requirePermission("audit_logs.read");
  const logs = await listAuditLogs(session.user.organizationId);

  const rows = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    actorName: log.actor?.name ?? "Hệ thống",
    timeLabel: formatDistanceToNow(log.createdAt, { addSuffix: true, locale: vi }),
  }));

  return (
    <>
      <PageHeader title="Nhật ký Audit" description="Lịch sử thay đổi trong hệ thống — append-only, không thể sửa/xoá (100 bản ghi gần nhất)" />

      <AuditLogTable logs={rows} />
    </>
  );
}
