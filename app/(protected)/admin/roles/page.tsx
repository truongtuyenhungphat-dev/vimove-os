import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listRoles, listPermissions } from "@/services/core/roles";
import { ROLE_LABELS } from "@/lib/permissions/role-defaults";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RolePermissionsSheet } from "./role-permissions-sheet";

export const metadata: Metadata = { title: "Vai trò — VIMOVE OS" };

export default async function RolesPage() {
  const session = await requirePermission("roles.read");
  const canManage = hasPermission(session, "roles.manage");

  const [roles, permissions] = await Promise.all([
    listRoles(session.user.organizationId),
    listPermissions(),
  ]);

  const permissionsByResource = Object.entries(
    permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
      (acc[p.resource] ??= []).push(p);
      return acc;
    }, {})
  );

  return (
    <>
      <PageHeader
        title="Vai trò"
        description="Danh mục vai trò cố định (§21) — cấu hình lại permission gắn với từng vai trò tại đây"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">Số người</TableHead>
                <TableHead className="text-right">Số quyền</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <p className="font-medium">{ROLE_LABELS[role.key] ?? role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.key}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{role._count.userRoles}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{role.rolePermissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <RolePermissionsSheet
                        roleId={role.id}
                        roleName={ROLE_LABELS[role.key] ?? role.name}
                        permissionsByResource={permissionsByResource}
                        currentPermissions={role.rolePermissions.map((rp) => ({ permissionId: rp.permissionId, scope: rp.scope }))}
                        disabled={!canManage || role.key === "SUPER_ADMIN"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
