"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { generateInsights } from "@/services/ai/insights";

export async function generateInsightsAction() {
  const session = await assertPermission("ai.manage");
  const count = await generateInsights(session.user.organizationId);
  revalidatePath("/ai/insights");
  revalidatePath("/ai/recommendations");
  return count;
}
