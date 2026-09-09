"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { recomputeDailyMetrics } from "@/services/analytics/daily-metrics";
import { runDataQualityScan, resolveIssue } from "@/services/analytics/data-quality";

export async function recomputeDailyMetricsAction() {
  const session = await assertPermission("analytics.manage");
  const count = await recomputeDailyMetrics(session.user.organizationId);
  revalidatePath("/analytics");
  return count;
}

export async function runDataQualityScanAction() {
  const session = await assertPermission("analytics.manage");
  const result = await runDataQualityScan(session.user.organizationId);
  revalidatePath("/analytics/data-quality");
  return result;
}

export async function resolveIssueAction(issueId: string, status: "RESOLVED" | "IGNORED") {
  const session = await assertPermission("analytics.manage");
  await resolveIssue(session.user.organizationId, issueId, status);
  revalidatePath("/analytics/data-quality");
}
