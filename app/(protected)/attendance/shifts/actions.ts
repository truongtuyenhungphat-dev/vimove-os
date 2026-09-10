"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createShift, deleteShift, assignShift, removeShiftAssignment } from "@/services/attendance/shifts";

export async function createShiftAction(formData: FormData) {
  const session = await assertPermission("attendance.manage");
  await createShift(session.user.organizationId, session.user.id, {
    name: String(formData.get("name")),
    startTime: String(formData.get("startTime")),
    endTime: String(formData.get("endTime")),
    breakMinutes: Number(formData.get("breakMinutes") || 0),
    colorHex: String(formData.get("colorHex") || "#2563eb"),
  });
  revalidatePath("/attendance/shifts");
}

export async function deleteShiftAction(id: string) {
  const session = await assertPermission("attendance.manage");
  await deleteShift(session.user.organizationId, session.user.id, id);
  revalidatePath("/attendance/shifts");
}

export async function assignShiftAction(formData: FormData) {
  const session = await assertPermission("attendance.manage");
  await assignShift(session.user.organizationId, session.user.id, {
    userId: String(formData.get("userId")),
    shiftId: String(formData.get("shiftId")),
    date: new Date(String(formData.get("date"))),
  });
  revalidatePath("/attendance/shifts");
}

export async function removeShiftAssignmentAction(userId: string, date: string) {
  const session = await assertPermission("attendance.manage");
  await removeShiftAssignment(session.user.organizationId, session.user.id, userId, new Date(date));
  revalidatePath("/attendance/shifts");
}
