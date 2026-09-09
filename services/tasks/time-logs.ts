import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

export async function addTimeLog(
  taskId: string,
  userId: string,
  data: { minutes: number; note?: string | null; loggedAt: Date }
) {
  const log = await prisma.taskTimeLog.create({
    data: { taskId, userId, minutes: data.minutes, note: data.note || null, loggedAt: data.loggedAt },
  });
  await writeTaskActivity({ taskId, actorId: userId, type: "TIME_LOGGED", payload: { minutes: data.minutes } });
  return log;
}

export async function removeTimeLog(logId: string) {
  await prisma.taskTimeLog.delete({ where: { id: logId } });
}
