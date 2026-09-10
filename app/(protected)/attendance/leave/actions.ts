"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createLeaveRequest } from "@/services/attendance/leave";
import type { LeaveType } from "@/lib/attendance/types";

export async function createLeaveRequestAction(formData: FormData) {
  const session = await assertPermission("leave_requests.create");

  const type = formData.get("type") as LeaveType;
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));
  const reason = String(formData.get("reason") || "");
  const approverIds = formData.getAll("approverIds").map(String).filter(Boolean);

  if (approverIds.length === 0) throw new Error("Cần chọn ít nhất 1 người duyệt");

  await createLeaveRequest(session.user.organizationId, session.user.id, {
    type,
    startDate,
    endDate,
    reason,
    approverIds,
  });

  revalidatePath("/attendance/leave");
  revalidatePath("/work/approvals");
}
