import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

export async function addChecklistItem(taskId: string, actorId: string, title: string) {
  const last = await prisma.taskChecklistItem.findFirst({ where: { taskId }, orderBy: { position: "desc" } });
  const item = await prisma.taskChecklistItem.create({
    data: { taskId, title, position: (last?.position ?? -1) + 1 },
  });
  await writeTaskActivity({ taskId, actorId, type: "CHECKLIST_ITEM_ADDED", payload: { title } });
  return item;
}

export async function toggleChecklistItem(taskId: string, actorId: string, itemId: string, isDone: boolean) {
  const item = await prisma.taskChecklistItem.update({ where: { id: itemId }, data: { isDone } });
  await writeTaskActivity({ taskId, actorId, type: "CHECKLIST_ITEM_TOGGLED", payload: { title: item.title, isDone } });
  return item;
}

export async function removeChecklistItem(taskId: string, actorId: string, itemId: string) {
  const item = await prisma.taskChecklistItem.delete({ where: { id: itemId } });
  await writeTaskActivity({ taskId, actorId, type: "CHECKLIST_ITEM_REMOVED", payload: { title: item.title } });
}
