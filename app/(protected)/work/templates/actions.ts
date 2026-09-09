"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createTaskTemplate, updateTaskTemplate, deleteTaskTemplate } from "@/services/tasks/templates";

const templateSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên mẫu"),
  description: z.string().trim().optional(),
  defaultPriority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

function parseChecklist(formData: FormData) {
  return formData.getAll("checklistItems").map(String).filter((v) => v.trim());
}

export async function createTemplateAction(formData: FormData) {
  const session = await assertPermission("task_templates.manage");
  const parsed = templateSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    defaultPriority: formData.get("defaultPriority"),
  });
  await createTaskTemplate(session.user.organizationId, session.user.id, {
    name: parsed.name,
    description: parsed.description || null,
    defaultPriority: parsed.defaultPriority,
    checklistItems: parseChecklist(formData),
  });
  revalidatePath("/work/templates");
}

export async function updateTemplateAction(templateId: string, formData: FormData) {
  const session = await assertPermission("task_templates.manage");
  const parsed = templateSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    defaultPriority: formData.get("defaultPriority"),
  });
  await updateTaskTemplate(session.user.organizationId, templateId, {
    name: parsed.name,
    description: parsed.description || null,
    defaultPriority: parsed.defaultPriority,
    checklistItems: parseChecklist(formData),
  });
  revalidatePath("/work/templates");
}

export async function deleteTemplateAction(templateId: string) {
  const session = await assertPermission("task_templates.manage");
  await deleteTaskTemplate(session.user.organizationId, templateId);
  revalidatePath("/work/templates");
}
