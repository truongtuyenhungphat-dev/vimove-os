import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listDepartments } from "@/services/core/departments";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DepartmentDialog } from "./department-dialog";
import { createDepartmentAction, updateDepartmentAction, deleteDepartmentAction } from "./actions";

export const metadata: Metadata = { title: "Phòng ban — VIMOVE OS" };

export default async function DepartmentsPage() {
  const session = await requirePermission("departments.read");
  const canCreate = hasPermission(session, "departments.create");
  const canUpdate = hasPermission(session, "departments.update");
  const canDelete = hasPermission(session, "departments.delete");

  const departments = await listDepartments(session.user.organizationId);
  const options = departments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <>
      <PageHeader
        title="Phòng ban"
        description="Cơ cấu tổ chức theo phòng ban"
        actions={canCreate ? <DepartmentDialog mode="create" departments={options} action={createDepartmentAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Building2} title="Chưa có phòng ban nào" description="Tạo phòng ban đầu tiên để bắt đầu." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên phòng ban</TableHead>
                  <TableHead>Trực thuộc</TableHead>
                  <TableHead className="text-right">Nhân sự</TableHead>
                  <TableHead className="text-right">Nhóm</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.parent?.name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{dept._count.users}</TableCell>
                    <TableCell className="text-right tabular-nums">{dept._count.teams}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <DepartmentDialog
                            mode="edit"
                            department={dept}
                            departments={options}
                            action={updateDepartmentAction.bind(null, dept.id)}
                          />
                        )}
                        {canDelete && (
                          <ConfirmDeleteButton
                            title="Xoá phòng ban?"
                            description={`Phòng ban "${dept.name}" sẽ bị xoá. Nhân sự thuộc phòng ban này sẽ không còn gắn phòng ban.`}
                            onConfirm={deleteDepartmentAction.bind(null, dept.id)}
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
