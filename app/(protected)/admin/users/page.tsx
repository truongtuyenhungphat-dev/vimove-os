import type { Metadata } from "next";
import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listUsers } from "@/services/core/users";
import { listDepartments } from "@/services/core/departments";
import { listRoles } from "@/services/core/roles";
import { ROLE_LABELS } from "@/lib/permissions/role-defaults";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { UserDialog } from "./user-dialog";
import { UserStatusToggle } from "./user-status-toggle";
import { UsersTable } from "./users-table";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";

export const metadata: Metadata = { title: "Người dùng — VIMOVE OS" };

export default async function UsersPage() {
  const session = await requirePermission("users.read");
  const canCreate = hasPermission(session, "users.create");
  const canUpdate = hasPermission(session, "users.update");
  const canDeactivate = hasPermission(session, "users.delete");

  const [users, departments, roles] = await Promise.all([
    listUsers(session.user.organizationId),
    listDepartments(session.user.organizationId),
    listRoles(session.user.organizationId),
  ]);

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));
  const roleOptions = roles.map((r) => ({ id: r.id, name: ROLE_LABELS[r.key] ?? r.name }));

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.length - activeCount;
  const departmentsInUse = new Set(users.filter((u) => u.departmentId).map((u) => u.departmentId)).size;

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    title: u.title,
    departmentId: u.departmentId,
    departmentName: u.department?.name ?? null,
    status: u.status,
    roleNames: u.userRoles.map((ur) => ROLE_LABELS[ur.role.key] ?? ur.role.name),
    actions: (
      <>
        {canUpdate && (
          <UserDialog
            mode="edit"
            user={{
              id: u.id,
              email: u.email,
              name: u.name,
              title: u.title,
              departmentId: u.departmentId,
              roleIds: u.userRoles.map((ur) => ur.roleId),
            }}
            departments={departmentOptions}
            roles={roleOptions}
            action={updateUserAction.bind(null, u.id)}
          />
        )}
        {canDeactivate && <UserStatusToggle userId={u.id} status={u.status} />}
        {canDeactivate && (
          <ConfirmDeleteButton
            title={`Xoá vĩnh viễn "${u.name}"?`}
            description="Chỉ xoá được nếu tài khoản này chưa tạo dữ liệu gì trong hệ thống (công việc, dự án, chấm công...). Nếu đã có dữ liệu, dùng nút Vô hiệu hoá ở trên để giữ lại lịch sử."
            onConfirm={deleteUserAction.bind(null, u.id)}
          />
        )}
      </>
    ),
  }));

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và phân quyền"
        actions={
          canCreate ? (
            <UserDialog mode="create" departments={departmentOptions} roles={roleOptions} action={createUserAction} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tổng người dùng" value={users.length} icon={Users} tone="primary" />
        <KpiCard label="Đang hoạt động" value={activeCount} icon={UserCheck} tone="muted" />
        <KpiCard label="Không hoạt động" value={inactiveCount} icon={UserX} tone={inactiveCount > 0 ? "warning" : "muted"} />
        <KpiCard label="Phòng ban có người" value={departmentsInUse} icon={Building2} tone="muted" hint={`Trên ${departments.length} phòng ban`} />
      </div>

      <UsersTable users={rows} departments={departmentOptions} />
    </>
  );
}
