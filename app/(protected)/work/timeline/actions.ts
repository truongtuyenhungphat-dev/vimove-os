"use server";

import { assertPermission } from "@/lib/auth/rbac";
import { rescheduleTask } from "@/services/tasks/tasks";
import { revalidateWorkViews } from "@/lib/work/revalidate";

export async function rescheduleTimelineTaskAction(taskId: string, startAt: Date, dueAt: Date) {
  const session = await assertPermission("tasks.update");
  await rescheduleTask(
    session.user.organizationId,
    session.user.id,
    taskId,
    { startAt, dueAt },
    { enforceDependencies: false }
  );
  revalidateWorkViews(taskId);
}
