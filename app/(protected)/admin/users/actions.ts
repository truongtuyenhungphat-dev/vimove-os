"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createUser, updateUser, setUserStatus, emailExists } from "@/services/core/users";

const createSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  departmentId: z.string().optional(),
  title: z.string().trim().optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự"),
  departmentId: z.string().optional(),
  title: z.string().trim().optional(),
});

function parseRoleIds(formData: FormData) {
  return formData.getAll("roleIds").map(String).filter(Boolean);
}

export async function createUserAction(formData: FormData) {
  const session = await assertPermission("users.create");
  const parsed = createSchema.parse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    departmentId: formData.get("departmentId") || undefined,
    title: formData.get("title") || undefined,
  });

  if (await emailExists(parsed.email)) {
    throw new Error("Email đã được sử dụng");
  }

  await createUser(session.user.organizationId, session.user.id, {
    ...parsed,
    roleIds: parseRoleIds(formData),
  });
  revalidatePath("/admin/users");
}

export async function updateUserAction(id: string, formData: FormData) {
  const session = await assertPermission("users.update");
  const parsed = updateSchema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId") || undefined,
    title: formData.get("title") || undefined,
  });

  await updateUser(session.user.organizationId, session.user.id, id, {
    ...parsed,
    roleIds: parseRoleIds(formData),
  });
  revalidatePath("/admin/users");
}

export async function setUserStatusAction(id: string, status: "ACTIVE" | "INACTIVE") {
  const session = await assertPermission("users.delete");
  if (id === session.user.id) {
    throw new Error("Không thể tự vô hiệu hoá tài khoản của chính mình");
  }
  await setUserStatus(session.user.organizationId, session.user.id, id, status);
  revalidatePath("/admin/users");
}
