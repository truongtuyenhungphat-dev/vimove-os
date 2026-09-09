"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { decideStep, cancelApprovalRequest } from "@/services/process/approvals";

export async function decideStepAction(stepId: string, decision: "APPROVED" | "REJECTED", comment?: string) {
  const session = await assertPermission("approvals.read");
  const parsed = z.enum(["APPROVED", "REJECTED"]).parse(decision);
  await decideStep(session.user.organizationId, session.user.id, stepId, parsed, comment || null);
  revalidatePath("/work/approvals");
}

export async function cancelApprovalAction(requestId: string) {
  const session = await assertPermission("approvals.manage");
  await cancelApprovalRequest(session.user.organizationId, session.user.id, requestId);
  revalidatePath("/work/approvals");
}
