"use server";

import { assertPermission } from "@/lib/auth/rbac";
import { checkInOrOut } from "@/services/attendance/checkin";

export async function checkInViaQrAction(token: string) {
  const session = await assertPermission("attendance.read");
  const record = await checkInOrOut(session.user.organizationId, session.user.id, { method: "QR", qrToken: token });
  return { type: record.type, occurredAt: record.occurredAt.toISOString(), locationName: record.location?.name ?? null };
}
