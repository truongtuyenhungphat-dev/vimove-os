import type { Metadata } from "next";
import Link from "next/link";
import { ListTodo } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listAllTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskFilters } from "@/components/work/task-filters";
import { TaskDialog } from "@/components/work/task-dialog";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/work/task-badges";
import { createTaskAction } from "./actions";
import type { TaskStatus, TaskPriority } from "@/lib/work/types";

export const metadata: Metadata = { title: "Tất cả công việc — VIMOVE OS" };

export default async function AllTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assigneeId?: string; tagId?: string; search?: string }>;
}) {
  const session = await requirePermission("tasks.read");
  const canCreate = hasPermission(session, "tasks.create");
  const params = await searchParams;
  const visibility = buildVisibilityScope(session, "tasks.read");
  const scopeDescription =
    visibility.scope === "OWN"
      ? "Công việc được giao cho bạn (phạm vi quyền của vai trò hiện tại)"
      : visibility.scope === "DEPARTMENT"
        ? "Công việc của phòng ban bạn (phạm vi quyền của vai trò hiện tại)"
        : "Toàn bộ công việc trong tổ chức";

  const [tasks, users, teams, templates, tags] = await Promise.all([
    listAllTasks(session.user.organizationId, {
      status: (params.status as TaskStatus) || undefined,
      priority: (params.priority as TaskPriority) || undefined,
      assigneeId: params.assigneeId || undefined,
      tagId: params.tagId || undefined,
      search: params.search || undefined,
    }, visibility),
    listUsers(session.user.organizationId),
    listTeams(session.user.organizationId),
    listTaskTemplates(session.user.organizationId),
    listTags(session.user.organizationId),
  ]);

  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));
  const templateOptions = templates.map((t) => ({
    id: t.id,
    name: t.name,
    defaultPriority: t.defaultPriority as TaskPriority,
    checklistItems: (t.checklistItems as string[] | null) ?? [],
  }));

  return (
    <>
      <PageHeader
        title="Tất cả công việc"
        description={scopeDescription}
        actions={
          canCreate ? (
            <TaskDialog
              mode="create"
              assignees={activeUsers}
              teams={teamOptions}
              tags={tags}
              templates={templateOptions}
              action={createTaskAction}
            />
          ) : undefined
        }
      />

      <TaskFilters assignees={activeUsers} tags={tags} />

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ListTodo} title="Không có công việc nào" description="Tạo công việc đầu tiên hoặc đổi bộ lọc." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
                  <TableHead>Người phụ trách</TableHead>
                  <TableHead>Hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/work/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status as TaskStatus} />
                    </TableCell>
                    <TableCell>
                      <TaskPriorityBadge priority={task.priority as TaskPriority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{task.assignee?.name ?? "Chưa gán"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.dueAt ? new Date(task.dueAt).toLocaleDateString("vi-VN") : "—"}
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
