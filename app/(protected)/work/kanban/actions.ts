"use server";

import { assertPermission } from "@/lib/auth/rbac";
import { moveTaskStatus } from "@/services/tasks/tasks";
import { revalidateWorkViews } from "@/lib/work/revalidate";
import type { TaskStatus } from "@/lib/work/types";

export async function moveTaskStatusAction(taskId: string, status: TaskStatus, targetIndex: number) {
  const session = await assertPermission("tasks.update");
  await moveTaskStatus(session.user.organizationId, session.user.id, taskId, { status, targetIndex });
  revalidateWorkViews(taskId);
}
