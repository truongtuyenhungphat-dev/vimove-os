"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createDepartment, updateDepartment, deleteDepartment } from "@/services/core/departments";

const schema = z.object({
  name: z.string().trim().min(2, "Tên phòng ban tối thiểu 2 ký tự"),
  parentId: z.string().optional(),
});

export async function createDepartmentAction(formData: FormData) {
  const session = await assertPermission("departments.create");
  const parsed = schema.parse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || undefined,
  });
  await createDepartment(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/admin/departments");
}

export async function updateDepartmentAction(id: string, formData: FormData) {
  const session = await assertPermission("departments.update");
  const parsed = schema.parse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || undefined,
  });
  await updateDepartment(session.user.organizationId, session.user.id, id, parsed);
  revalidatePath("/admin/departments");
}

export async function deleteDepartmentAction(id: string) {
  const session = await assertPermission("departments.delete");
  await deleteDepartment(session.user.organizationId, session.user.id, id);
  revalidatePath("/admin/departments");
}
