"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { resumeAfterApproval } from "@/services/process/workflow-engine";

export async function decideRunStepAction(runId: string, stepId: string, approved: boolean) {
  const session = await assertPermission("workflows.read");
  await resumeAfterApproval(session.user.organizationId, session.user.id, stepId, approved);
  revalidatePath(`/process/runs/${runId}`);
}
