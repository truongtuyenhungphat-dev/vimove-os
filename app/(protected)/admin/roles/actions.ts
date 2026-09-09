"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/rbac";
import { updateRolePermissions } from "@/services/core/roles";

const permissionAssignmentSchema = z.object({
  permissionId: z.string(),
  scope: z.enum(["ALL", "DEPARTMENT", "OWN"]).optional(),
});

export async function updateRolePermissionsAction(roleId: string, permissions: { permissionId: string; scope?: "ALL" | "DEPARTMENT" | "OWN" }[]) {
  const session = await assertPermission("roles.manage");
  const parsed = z.array(permissionAssignmentSchema).parse(permissions);
  await updateRolePermissions(session.user.organizationId, session.user.id, roleId, parsed);
  revalidatePath("/admin/roles");
}
