import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";

export async function listShifts(organizationId: string) {
  return prisma.shift.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
}

export async function createShift(
  organizationId: string,
  actorId: string,
  data: { name: string; startTime: string; endTime: string; breakMinutes: number; colorHex: string }
) {
  const shift = await prisma.shift.create({ data: { organizationId, createdById: actorId, ...data } });
  await writeAuditLog({ organizationId, actorId, action: "shift.create", entityType: "Shift", entityId: shift.id, after: data });
  return shift;
}

export async function deleteShift(organizationId: string, actorId: string, id: string) {
  const shift = await prisma.shift.findFirst({ where: { id, organizationId } });
  if (!shift) throw new Error("Không tìm thấy ca làm việc");
  await prisma.shift.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "shift.delete", entityType: "Shift", entityId: id, before: { name: shift.name } });
}

/** Xếp ca cho 1 user vào 1 ngày — ghi đè nếu ngày đó đã có ca khác (unique [userId, date]). */
export async function assignShift(organizationId: string, actorId: string, data: { userId: string; shiftId: string; date: Date }) {
  const shift = await prisma.shift.findFirst({ where: { id: data.shiftId, organizationId } });
  if (!shift) throw new Error("Không tìm thấy ca làm việc");

  const assignment = await prisma.shiftAssignment.upsert({
    where: { userId_date: { userId: data.userId, date: data.date } },
    update: { shiftId: data.shiftId },
    create: { organizationId, userId: data.userId, shiftId: data.shiftId, date: data.date },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "shift_assignment.set",
    entityType: "ShiftAssignment",
    entityId: assignment.id,
    after: { userId: data.userId, shiftId: data.shiftId, date: data.date.toISOString().slice(0, 10) },
  });
  return assignment;
}

export async function removeShiftAssignment(organizationId: string, actorId: string, userId: string, date: Date) {
  const assignment = await prisma.shiftAssignment.findFirst({ where: { organizationId, userId, date } });
  if (!assignment) return;
  await prisma.shiftAssignment.delete({ where: { id: assignment.id } });
  await writeAuditLog({ organizationId, actorId, action: "shift_assignment.remove", entityType: "ShiftAssignment", entityId: assignment.id });
}

/** Lịch xếp ca trong 1 khoảng ngày, kèm tên user — dùng cho lưới xếp ca dạng bảng. */
export async function listShiftAssignments(organizationId: string, from: Date, to: Date) {
  return prisma.shiftAssignment.findMany({
    where: { organizationId, date: { gte: from, lte: to } },
    include: { shift: true, user: { select: { id: true, name: true } } },
    orderBy: [{ date: "asc" }],
  });
}
