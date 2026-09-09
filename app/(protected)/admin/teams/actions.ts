"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createTeam, updateTeam, deleteTeam, setTeamMembers } from "@/services/core/teams";

const schema = z.object({
  name: z.string().trim().min(2, "Tên nhóm tối thiểu 2 ký tự"),
  departmentId: z.string().optional(),
});

export async function createTeamAction(formData: FormData) {
  const session = await assertPermission("teams.create");
  const parsed = schema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId") || undefined,
  });
  await createTeam(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/admin/teams");
}

export async function updateTeamAction(id: string, formData: FormData) {
  const session = await assertPermission("teams.update");
  const parsed = schema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId") || undefined,
  });
  await updateTeam(session.user.organizationId, session.user.id, id, parsed);
  revalidatePath("/admin/teams");
}

export async function deleteTeamAction(id: string) {
  const session = await assertPermission("teams.delete");
  await deleteTeam(session.user.organizationId, session.user.id, id);
  revalidatePath("/admin/teams");
}

export async function setTeamMembersAction(id: string, userIds: string[]) {
  const session = await assertPermission("teams.update");
  await setTeamMembers(session.user.organizationId, session.user.id, id, userIds);
  revalidatePath("/admin/teams");
}
