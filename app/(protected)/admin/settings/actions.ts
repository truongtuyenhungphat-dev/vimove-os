"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { updateOrganization } from "@/services/core/organization";

const schema = z.object({ name: z.string().trim().min(2, "Tên tổ chức tối thiểu 2 ký tự") });

export type ActionState = { error?: string; success?: string } | undefined;

export async function updateOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await assertPermission("organization.manage");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  await updateOrganization(session.user.organizationId, session.user.id, parsed.data);
  revalidatePath("/admin/settings");
  return { success: "Đã lưu cài đặt tổ chức" };
}
