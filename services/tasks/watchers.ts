import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

export async function toggleWatcher(taskId: string, userId: string) {
  const existing = await prisma.taskWatcher.findUnique({ where: { taskId_userId: { taskId, userId } } });
  if (existing) {
    await prisma.taskWatcher.delete({ where: { id: existing.id } });
    await writeTaskActivity({ taskId, actorId: userId, type: "WATCHER_REMOVED" });
    return { watching: false };
  }
  await prisma.taskWatcher.create({ data: { taskId, userId } });
  await writeTaskActivity({ taskId, actorId: userId, type: "WATCHER_ADDED" });
  return { watching: true };
}
