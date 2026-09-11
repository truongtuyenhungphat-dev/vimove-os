import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listUsers } from "@/services/core/users";
import { listDepartments } from "@/services/core/departments";
import { listRoles } from "@/services/core/roles";
import { ROLE_LABELS } from "@/lib/permissions/role-defaults";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { UserDialog } from "./user-dialog";
import { UserStatusToggle } from "./user-status-toggle";
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

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Chưa có người dùng nào" description="Tạo tài khoản đầu tiên để bắt đầu." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.department?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.userRoles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          u.userRoles.map((ur) => (
                            <Badge key={ur.id} variant="secondary" className="font-normal">
                              {ROLE_LABELS[ur.role.key] ?? ur.role.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "default" : "outline"}>
                        {u.status === "ACTIVE" ? "Hoạt động" : "Đã vô hiệu hoá"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
