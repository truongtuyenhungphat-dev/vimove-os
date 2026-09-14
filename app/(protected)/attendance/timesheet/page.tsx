import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { computeMonthlyTimesheet, listAttendanceScopedUsers } from "@/services/attendance/timesheet";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAVE_TYPE_LABELS } from "@/lib/attendance/types";
import { formatVnDate, formatVnTime } from "@/lib/format";

export const metadata: Metadata = { title: "Bảng công — VIMOVE OS" };

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; userId?: string }>;
}) {
  const session = await requirePermission("attendance.read");
  const params = await searchParams;
  const visibility = buildVisibilityScope(session, "attendance.read");

  const monthDate = params.month ? new Date(`${params.month}-01T00:00:00`) : new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const targetUserId = visibility.scope === "OWN" ? session.user.id : params.userId || session.user.id;

  const [{ days, totalHours }, scopedUsers] = await Promise.all([
    computeMonthlyTimesheet(session.user.organizationId, targetUserId, year, month),
    visibility.scope !== "OWN" ? listAttendanceScopedUsers(session.user.organizationId, visibility) : Promise.resolve([]),
  ]);

  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);
  const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const linkWithUser = (m: string) => `/attendance/timesheet?month=${m}${params.userId ? `&userId=${params.userId}` : ""}`;

  return (
    <>
      <PageHeader
        title="Bảng công"
        description={
          visibility.scope === "OWN"
            ? "Bảng công của bạn (phạm vi quyền của vai trò hiện tại)"
            : "Bảng công — có thể xem theo nhân sự trong phạm vi quyền của bạn"
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" nativeButton={false} render={<Link href={linkWithUser(fmtMonth(prevMonth))} aria-label="Tháng trước" />}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-24 text-center text-sm font-medium">Tháng {month}/{year}</span>
            <Button size="icon" variant="outline" nativeButton={false} render={<Link href={linkWithUser(fmtMonth(nextMonth))} aria-label="Tháng sau" />}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {scopedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scopedUsers.map((u) => (
            <Button
              key={u.id}
              size="sm"
              variant={targetUserId === u.id ? "secondary" : "ghost"}
              nativeButton={false}
              render={<Link href={`/attendance/timesheet?month=${fmtMonth(monthDate)}&userId=${u.id}`} />}
            >
              {u.name}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Tổng giờ làm trong tháng</p>
          <p className="text-2xl font-semibold tabular-nums">{totalHours}h</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Ca làm</TableHead>
                <TableHead>Giờ vào</TableHead>
                <TableHead>Giờ ra</TableHead>
                <TableHead className="text-right">Số giờ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d) => (
                <TableRow key={d.date}>
                  <TableCell>{formatVnDate(d.date, { weekday: "short", day: "2-digit", month: "2-digit" })}</TableCell>
                  <TableCell className="text-muted-foreground">{d.shiftName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.checkIn ? formatVnTime(d.checkIn, { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.checkOut ? formatVnTime(d.checkOut, { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.workedHours > 0 ? `${d.workedHours}h` : "—"}</TableCell>
                  <TableCell>
                    {d.onLeave ? (
                      <Badge variant="secondary">{LEAVE_TYPE_LABELS[d.leaveType as keyof typeof LEAVE_TYPE_LABELS]}</Badge>
                    ) : d.checkIn && !d.checkOut ? (
                      <Badge variant="outline" className="text-amber-600">Chưa chấm ra</Badge>
                    ) : d.workedHours > 0 ? (
                      <Badge variant="outline" className="text-emerald-600">Đủ công</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
