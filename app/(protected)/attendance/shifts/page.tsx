import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { listShifts, listShiftAssignments } from "@/services/attendance/shifts";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShiftDialog } from "@/components/attendance/shift-dialog";
import { AssignShiftForm } from "@/components/attendance/assign-shift-form";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { CalendarClock } from "lucide-react";
import { createShiftAction, deleteShiftAction, assignShiftAction, removeShiftAssignmentAction } from "./actions";

export const metadata: Metadata = { title: "Xếp ca — VIMOVE OS" };

export default async function ShiftsPage() {
  const session = await requirePermission("attendance.manage");

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 13);

  const [shifts, assignments, users] = await Promise.all([
    listShifts(session.user.organizationId),
    listShiftAssignments(session.user.organizationId, from, to),
    listUsers(session.user.organizationId),
  ]);

  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader title="Xếp ca" description="Quản lý mẫu ca làm việc và xếp ca cho nhân sự (14 ngày tới)" actions={<ShiftDialog action={createShiftAction} />} />

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Mẫu ca làm việc</p>
          {shifts.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Chưa có ca làm việc nào" description="Tạo mẫu ca đầu tiên để bắt đầu xếp ca." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.startTime}–{s.endTime}
                  </span>
                  <ConfirmDeleteButton
                    title={`Xoá ca "${s.name}"`}
                    description="Các lượt xếp ca dùng ca này cũng sẽ bị xoá theo."
                    onConfirm={deleteShiftAction.bind(null, s.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Xếp ca mới</p>
          <AssignShiftForm users={activeUsers} shifts={shifts.map((s) => ({ id: s.id, name: s.name }))} action={assignShiftAction} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CalendarClock} title="Chưa có lịch xếp ca trong 14 ngày tới" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Nhân sự</TableHead>
                  <TableHead>Ca</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</TableCell>
                    <TableCell>{a.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: a.shift.colorHex, color: a.shift.colorHex }}>
                        {a.shift.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteButton
                        title="Bỏ xếp ca này"
                        description="Xoá lượt xếp ca này khỏi lịch."
                        onConfirm={removeShiftAssignmentAction.bind(null, a.userId, a.date.toISOString().slice(0, 10))}
                      />
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
