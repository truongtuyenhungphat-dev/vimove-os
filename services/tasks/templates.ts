import "server-only";
import { prisma } from "@/lib/db/client";
import type { TaskPriority } from "@/lib/work/types";

// checklistItems lưu dạng JSON string[] — copy-on-instantiate khi tạo task mới từ mẫu,
// không phải quan hệ sống (xem docs/02-work-hub.md).
export async function listTaskTemplates(organizationId: string) {
  return prisma.taskTemplate.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
}

export async function getTaskTemplate(organizationId: string, id: string) {
  return prisma.taskTemplate.findFirst({ where: { id, organizationId } });
}

export async function createTaskTemplate(
  organizationId: string,
  createdById: string,
  data: { name: string; description?: string | null; defaultPriority: TaskPriority; checklistItems: string[] }
) {
  return prisma.taskTemplate.create({
    data: {
      organizationId,
      createdById,
      name: data.name,
      description: data.description || null,
      defaultPriority: data.defaultPriority,
      checklistItems: data.checklistItems,
    },
  });
}

export async function updateTaskTemplate(
  organizationId: string,
  id: string,
  data: { name: string; description?: string | null; defaultPriority: TaskPriority; checklistItems: string[] }
) {
  const existing = await getTaskTemplate(organizationId, id);
  if (!existing) throw new Error("Không tìm thấy mẫu công việc");
  return prisma.taskTemplate.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      defaultPriority: data.defaultPriority,
      checklistItems: data.checklistItems,
    },
  });
}

export async function deleteTaskTemplate(organizationId: string, id: string) {
  const existing = await getTaskTemplate(organizationId, id);
  if (!existing) throw new Error("Không tìm thấy mẫu công việc");
  await prisma.taskTemplate.delete({ where: { id } });
}
