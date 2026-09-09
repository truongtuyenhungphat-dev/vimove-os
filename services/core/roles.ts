import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "./audit";
import type { PermissionScope } from "@/app/generated/prisma/client";

export async function listRoles(organizationId: string) {
  return prisma.role.findMany({
    where: { organizationId },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRole(organizationId: string, id: string) {
  return prisma.role.findFirst({
    where: { id, organizationId },
    include: { rolePermissions: { include: { permission: true } } },
  });
}

/**
 * Vai trò trong Phase 1 là danh mục cố định seed từ RoleKey enum (§21) — trang Roles
 * chỉ cho phép cấu hình lại permission gắn với từng role, không tạo/xoá role tuỳ ý.
 */
export async function updateRolePermissions(
  organizationId: string,
  actorId: string,
  roleId: string,
  permissions: { permissionId: string; scope?: PermissionScope }[]
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, organizationId } });
  if (!role) throw new Error("Không tìm thấy vai trò");
  if (role.isSystem && role.key === "SUPER_ADMIN") {
    throw new Error("Không thể sửa quyền của vai trò Quản trị tối cao");
  }

  const before = await prisma.rolePermission.findMany({ where: { roleId } });
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.permissionId, scope: p.scope ?? "ALL" })),
      skipDuplicates: true,
    }),
  ]);
  await writeAuditLog({
    organizationId,
    actorId,
    action: "role.permissions.update",
    entityType: "Role",
    entityId: roleId,
    before,
    after: permissions,
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
}
