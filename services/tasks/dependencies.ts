import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

/** DFS theo chiều "phụ thuộc vào" từ dependsOnTaskId — nếu gặp lại taskId thì tạo chu trình. */
async function wouldCreateCycle(taskId: string, dependsOnTaskId: string): Promise<boolean> {
  const visited = new Set<string>();
  const stack = [dependsOnTaskId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnTaskId: true },
    });
    for (const d of deps) stack.push(d.dependsOnTaskId);
  }
  return false;
}

export async function addDependency(organizationId: string, actorId: string, taskId: string, dependsOnTaskId: string) {
  if (taskId === dependsOnTaskId) throw new Error("Công việc không thể phụ thuộc vào chính nó");

  const dependsOnTask = await prisma.task.findFirst({ where: { id: dependsOnTaskId, organizationId } });
  if (!dependsOnTask) throw new Error("Không tìm thấy công việc phụ thuộc");

  if (await wouldCreateCycle(taskId, dependsOnTaskId)) {
    throw new Error("Không thể thêm — sẽ tạo vòng lặp phụ thuộc");
  }

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
  });
  if (existing) throw new Error("Phụ thuộc này đã tồn tại");

  const dependency = await prisma.taskDependency.create({ data: { taskId, dependsOnTaskId } });
  await writeTaskActivity({
    taskId,
    actorId,
    type: "DEPENDENCY_ADDED",
    payload: { dependsOnTaskId, title: dependsOnTask.title },
  });
  return dependency;
}

export async function removeDependency(taskId: string, actorId: string, dependencyId: string) {
  const dep = await prisma.taskDependency.delete({ where: { id: dependencyId } });
  await writeTaskActivity({ taskId, actorId, type: "DEPENDENCY_REMOVED", payload: { dependsOnTaskId: dep.dependsOnTaskId } });
}
