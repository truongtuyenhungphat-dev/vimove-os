"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/rbac";
import { updateOwnProfile, changeOwnPassword } from "@/services/core/users";

export type ActionState = { error?: string; success?: string } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự"),
  title: z.string().trim().optional(),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  await updateOwnProfile(session.user.organizationId, session.user.id, parsed.data);
  revalidatePath("/dashboard/profile");
  return { success: "Đã lưu thông tin cá nhân" };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await changeOwnPassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Có lỗi xảy ra" };
  }
  return { success: "Đã đổi mật khẩu" };
}
