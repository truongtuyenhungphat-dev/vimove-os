import "server-only";
import { prisma } from "@/lib/db/client";
import type { AttendanceVisibility } from "./checkin";

export type DayTimesheet = {
  date: string; // yyyy-MM-dd
  checkIn: Date | null;
  checkOut: Date | null;
  workedHours: number; // 0 nếu thiếu 1 trong 2 mốc (chưa chấm ra, hoặc quên chấm vào)
  shiftName: string | null;
  onLeave: boolean;
  leaveType: string | null;
};

/**
 * Tổng hợp bảng công THẬT từ dữ liệu đã ghi — không suy đoán giờ làm nếu thiếu dữ
 * liệu (ngày chỉ có chấm vào không có chấm ra → workedHours = 0, hiển thị rõ "chưa
 * chấm ra" ở UI thay vì bịa số giờ).
 */
export async function computeMonthlyTimesheet(organizationId: string, userId: string, year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);

  const [records, assignments, leaves] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { organizationId, userId, occurredAt: { gte: from, lte: to } },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.shiftAssignment.findMany({
      where: { organizationId, userId, date: { gte: from, lte: to } },
      include: { shift: { select: { name: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { organizationId, userId, startDate: { lte: to }, endDate: { gte: from } },
      include: { approvalRequest: { select: { status: true } } },
    }),
  ]);

  const daysInMonth = to.getDate();
  const days: DayTimesheet[] = [];
  let totalHours = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month - 1, d);
    const dateKey = dayDate.toISOString().slice(0, 10);
    const dayRecords = records.filter((r) => r.occurredAt.toDateString() === dayDate.toDateString());
    const checkIn = dayRecords.find((r) => r.type === "CHECK_IN")?.occurredAt ?? null;
    const checkOut = [...dayRecords].reverse().find((r) => r.type === "CHECK_OUT")?.occurredAt ?? null;
    const workedHours = checkIn && checkOut && checkOut > checkIn ? Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) / 100 : 0;

    const assignment = assignments.find((a) => a.date.toDateString() === dayDate.toDateString());
    const leave = leaves.find(
      (l) => l.approvalRequest.status === "APPROVED" && dayDate >= new Date(l.startDate.toDateString()) && dayDate <= new Date(l.endDate.toDateString())
    );

    days.push({
      date: dateKey,
      checkIn,
      checkOut,
      workedHours,
      shiftName: assignment?.shift.name ?? null,
      onLeave: !!leave,
      leaveType: leave?.type ?? null,
    });
    totalHours += workedHours;
  }

  return { days, totalHours: Math.round(totalHours * 100) / 100 };
}

function visibilityWhere(visibility: AttendanceVisibility) {
  if (visibility.scope === "OWN") return { id: visibility.userId };
  if (visibility.scope === "DEPARTMENT") {
    return visibility.departmentId ? { departmentId: visibility.departmentId } : { id: { in: [] as string[] } };
  }
  return {};
}

/** Danh sách nhân sự trong phạm vi quyền — dùng cho dropdown "xem bảng công của" ở trang quản lý. */
export async function listAttendanceScopedUsers(organizationId: string, visibility: AttendanceVisibility) {
  return prisma.user.findMany({
    where: { organizationId, status: "ACTIVE", ...visibilityWhere(visibility) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
