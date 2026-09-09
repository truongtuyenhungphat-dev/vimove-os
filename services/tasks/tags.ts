import "server-only";
import { prisma } from "@/lib/db/client";

export async function listTags(organizationId: string) {
  return prisma.tag.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
}

export async function createTag(organizationId: string, data: { name: string; color: string }) {
  return prisma.tag.create({ data: { organizationId, name: data.name, color: data.color } });
}

export async function setTaskTags(taskId: string, tagIds: string[]) {
  await prisma.$transaction([
    prisma.taskTag.deleteMany({ where: { taskId } }),
    prisma.taskTag.createMany({ data: tagIds.map((tagId) => ({ taskId, tagId })), skipDuplicates: true }),
  ]);
}
