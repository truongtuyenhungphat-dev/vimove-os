"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { approveRecommendation, rejectRecommendation } from "@/services/ai/recommendations";

export async function approveRecommendationAction(recommendationId: string) {
  const session = await assertPermission("ai.manage");
  await approveRecommendation(session.user.organizationId, session.user.id, recommendationId);
  revalidatePath("/ai/recommendations");
}

export async function rejectRecommendationAction(recommendationId: string) {
  const session = await assertPermission("ai.manage");
  await rejectRecommendation(session.user.organizationId, session.user.id, recommendationId);
  revalidatePath("/ai/recommendations");
}
