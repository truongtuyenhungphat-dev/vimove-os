import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { requirePermission } from "@/lib/auth/rbac";
import { listAuditLogs } from "@/services/core/audit";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Nhật ký Audit — VIMOVE OS" };

export default async function AuditLogsPage() {
  const session = await requirePermission("audit_logs.read");
  const logs = await listAuditLogs(session.user.organizationId);

  return (
    <>
      <PageHeader title="Nhật ký Audit" description="Lịch sử thay đổi trong hệ thống — append-only, không thể sửa/xoá" />

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ScrollText} title="Chưa có hoạt động nào được ghi nhận" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Đối tượng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: vi })}
                    </TableCell>
                    <TableCell>{log.actor?.name ?? "Hệ thống"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.entityType} · {log.entityId.slice(0, 8)}
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
