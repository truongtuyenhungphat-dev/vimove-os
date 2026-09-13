import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { listPermissions } from "@/services/core/roles";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionsTable } from "./permissions-table";

export const metadata: Metadata = { title: "Quyền hạn — VIMOVE OS" };

export default async function PermissionsPage() {
  await requirePermission("roles.read");
  const permissions = await listPermissions();

  return (
    <>
      <PageHeader
        title="Danh mục quyền hạn"
        description="Toàn bộ permission dạng resource.action trong hệ thống (chỉ đọc — gán quyền tại trang Vai trò)"
      />

      <PermissionsTable permissions={permissions} />
    </>
  );
}
