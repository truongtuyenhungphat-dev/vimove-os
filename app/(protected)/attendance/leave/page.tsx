import type { Metadata } from "next";
import Link from "next/link";
import { CalendarOff, Clock, CheckCircle2, XCircle } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listOrgLeaveRequests } from "@/services/attendance/leave";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaveRequestDialog } from "@/components/attendance/leave-request-dialog";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/attendance/types";
import { APPROVAL_STATUS_LABELS } from "@/lib/process/types";
import { createLeaveRequestAction } from "./actions";

export const metadata: Metadata = { title: "Đơn nghỉ phép — VIMOVE OS" };

export default async function LeaveRequestsPage() {
  const session = await requirePermission("attendance.read");
  const canCreate = hasPermission(session, "leave_requests.create");
  const visibility = buildVisibilityScope(session, "attendance.read");

  const [requests, users] = await Promise.all([
    listOrgLeaveRequests(session.user.organizationId, visibility),
    listUsers(session.user.organizationId),
  ]);

  const approverOptions = users
    .filter((u) => u.status === "ACTIVE" && u.id !== session.user.id)
    .map((u) => ({ id: u.id, name: u.name }));

  const pendingCount = requests.filter((r) => r.approvalRequest.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.approvalRequest.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.approvalRequest.status === "REJECTED").length;

  return (
    <>
      <PageHeader
        title="Đơn nghỉ phép"
        description={
          visibility.scope === "OWN"
            ? "Đơn nghỉ phép của bạn (phạm vi quyền của vai trò hiện tại)"
            : visibility.scope === "DEPARTMENT"
              ? "Đơn nghỉ phép của phòng ban bạn (phạm vi quyền của vai trò hiện tại)"
              : "Toàn bộ đơn nghỉ phép trong tổ chức"
        }
        actions={canCreate ? <LeaveRequestDialog approvers={approverOptions} action={createLeaveRequestAction} /> : undefined}
      />

      {requests.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Tổng đơn" value={requests.length} icon={CalendarOff} tone="primary" />
          <KpiCard label="Chờ duyệt" value={pendingCount} icon={Clock} tone={pendingCount > 0 ? "warning" : "muted"} />
          <KpiCard label="Đã duyệt" value={approvedCount} icon={CheckCircle2} tone="muted" />
          <KpiCard label="Đã từ chối" value={rejectedCount} icon={XCircle} tone="muted" />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CalendarOff} title="Chưa có đơn nghỉ phép nào" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.user.name}</TableCell>
                    <TableCell>{LEAVE_TYPE_LABELS[r.type as LeaveType]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.startDate).toLocaleDateString("vi-VN")} — {new Date(r.endDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.approvalRequest.status === "APPROVED" ? "default" : r.approvalRequest.status === "REJECTED" ? "destructive" : "secondary"}
                      >
                        {APPROVAL_STATUS_LABELS[r.approvalRequest.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Duyệt/từ chối đơn nghỉ phép thực hiện ở <Link href="/work/approvals" className="underline">Approval Hub</Link>.
      </p>
    </>
  );
}
