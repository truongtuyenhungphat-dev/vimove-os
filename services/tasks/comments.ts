import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

export async function addComment(taskId: string, authorId: string, body: string) {
  const comment = await prisma.taskComment.create({ data: { taskId, authorId, body } });
  await writeTaskActivity({ taskId, actorId: authorId, type: "COMMENTED", payload: { preview: body.slice(0, 140) } });
  return comment;
}

export async function deleteComment(taskId: string, commentId: string) {
  await prisma.taskComment.delete({ where: { id: commentId } });
}
