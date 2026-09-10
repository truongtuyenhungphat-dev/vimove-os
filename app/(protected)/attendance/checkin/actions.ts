"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { checkInOrOut } from "@/services/attendance/checkin";
import type { AttendanceMethod } from "@/lib/attendance/types";

export async function checkInOrOutAction(input: { method: AttendanceMethod; latitude?: number; longitude?: number }) {
  const session = await assertPermission("attendance.read");
  const record = await checkInOrOut(session.user.organizationId, session.user.id, input);
  revalidatePath("/attendance/checkin");
  revalidatePath("/attendance/timesheet");
  return { type: record.type, occurredAt: record.occurredAt.toISOString(), locationName: record.location?.name ?? null };
}
