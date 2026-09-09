"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/rbac";
import { markNotificationRead, markAllNotificationsRead } from "@/services/core/notifications";

export async function markReadAction(id: string) {
  const session = await requireSession();
  await markNotificationRead(session.user.id, id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllReadAction() {
  const session = await requireSession();
  await markAllNotificationsRead(session.user.id);
  revalidatePath("/dashboard/notifications");
}
