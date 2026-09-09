import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listReports } from "@/services/analytics/reports";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportDialog } from "@/components/analytics/report-dialog";
import { createReportAction } from "./actions";

export const metadata: Metadata = { title: "Report Builder — VIMOVE OS" };

export default async function ReportsPage() {
  const session = await requirePermission("analytics.read");
  const canManage = hasPermission(session, "analytics.manage");
  const reports = await listReports(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Report Builder"
        description="Dataset → Dimension → Metric → Filter → Grouping → Visualization"
        actions={canManage ? <ReportDialog action={createReportAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={BarChart3} title="Chưa có report nào" description="Tạo report đầu tiên rồi thêm widget để xem số liệu." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên report</TableHead>
                  <TableHead>Số widget</TableHead>
                  <TableHead>Tạo bởi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/analytics/reports/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r._count.widgets}</TableCell>
                    <TableCell className="text-muted-foreground">{r.createdBy.name}</TableCell>
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
