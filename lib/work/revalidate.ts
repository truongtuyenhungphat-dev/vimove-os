import "server-only";
import { revalidatePath } from "next/cache";

/** Task xuất hiện ở nhiều view (My Tasks/All Tasks/Kanban/Calendar/Timeline/Gantt/
 * Workload) — revalidate cả cụm sau mỗi mutation thay vì tính chính xác từng path. */
export function revalidateWorkViews(taskId?: string) {
  revalidatePath("/work/my-tasks");
  revalidatePath("/work/tasks");
  revalidatePath("/work/kanban");
  revalidatePath("/work/calendar");
  revalidatePath("/work/timeline");
  revalidatePath("/work/gantt");
  revalidatePath("/work/workload");
  if (taskId) revalidatePath(`/work/tasks/${taskId}`);
}
