"use server";

import { assertPermission } from "@/lib/auth/rbac";
import { rescheduleTask } from "@/services/tasks/tasks";
import { revalidateWorkViews } from "@/lib/work/revalidate";

/** enforceDependencies=true — server re-validate ràng buộc dù client đã tự clamp. */
export async function rescheduleGanttTaskAction(taskId: string, startAt: Date, dueAt: Date) {
  const session = await assertPermission("tasks.update");
  await rescheduleTask(
    session.user.organizationId,
    session.user.id,
    taskId,
    { startAt, dueAt },
    { enforceDependencies: true }
  );
  revalidateWorkViews(taskId);
}
