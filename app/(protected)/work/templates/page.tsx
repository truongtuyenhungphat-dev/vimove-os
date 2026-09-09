import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listTaskTemplates } from "@/services/tasks/templates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskPriorityBadge } from "@/components/work/task-badges";
import { TemplateDialog } from "@/components/work/template-dialog";
import { createTemplateAction, updateTemplateAction, deleteTemplateAction } from "./actions";
import type { TaskPriority } from "@/lib/work/types";

export const metadata: Metadata = { title: "Mẫu công việc — VIMOVE OS" };

export default async function TaskTemplatesPage() {
  const session = await requirePermission("tasks.read");
  const canManage = hasPermission(session, "task_templates.manage");

  if (!canManage) {
    return (
      <>
        <PageHeader title="Mẫu công việc" description="Quản lý mẫu tạo nhanh công việc" />
        <PermissionDenied permission="task_templates.manage" />
      </>
    );
  }

  const templates = await listTaskTemplates(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Mẫu công việc"
        description="Quản lý mẫu tạo nhanh công việc"
        actions={<TemplateDialog mode="create" action={createTemplateAction} />}
      />

      <Card>
        <CardContent className="p-0">
          {templates.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={LayoutTemplate}
                title="Chưa có mẫu nào"
                description="Tạo mẫu đầu tiên để dùng lại khi tạo công việc."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên mẫu</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-medium">{t.name}</p>
                      {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    </TableCell>
                    <TableCell>
                      <TaskPriorityBadge priority={t.defaultPriority as TaskPriority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {((t.checklistItems as string[] | null) ?? []).length} mục
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <TemplateDialog
                          mode="edit"
                          template={{
                            id: t.id,
                            name: t.name,
                            description: t.description,
                            defaultPriority: t.defaultPriority as TaskPriority,
                            checklistItems: (t.checklistItems as string[] | null) ?? [],
                          }}
                          action={updateTemplateAction.bind(null, t.id)}
                        />
                        <ConfirmDeleteButton
                          title="Xoá mẫu công việc"
                          description={`Xoá mẫu "${t.name}" — không thể hoàn tác.`}
                          onConfirm={deleteTemplateAction.bind(null, t.id)}
                        />
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
