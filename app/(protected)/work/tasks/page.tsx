import type { Metadata } from "next";
import Link from "next/link";
import { ListTodo, AlarmClockOff, UserX, CheckCircle2 } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listAllTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskFilters } from "@/components/work/task-filters";
import { TaskDialog } from "@/components/work/task-dialog";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/work/task-badges";
import { cn } from "@/lib/utils";
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

  const now = new Date();
  const openTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const overdue = openTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()).length;
  const unassigned = openTasks.filter((t) => !t.assignee).length;
  const done = tasks.filter((t) => t.status === "DONE").length;

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tổng công việc" value={tasks.length} icon={ListTodo} tone="primary" />
        <KpiCard label="Quá hạn" value={overdue} icon={AlarmClockOff} tone={overdue > 0 ? "warning" : "muted"} />
        <KpiCard label="Chưa gán người" value={unassigned} icon={UserX} tone={unassigned > 0 ? "warning" : "muted"} />
        <KpiCard label="Đã hoàn thành" value={done} icon={CheckCircle2} tone="muted" />
      </div>

      <TaskFilters assignees={activeUsers} tags={tags} />

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ListTodo} title="Không có công việc nào" description="Tạo công việc đầu tiên hoặc đổi bộ lọc." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Công việc</TableHead>
                    <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
                    <TableHead className="hidden sm:table-cell">Độ ưu tiên</TableHead>
                    <TableHead className="hidden md:table-cell">Người phụ trách</TableHead>
                    <TableHead>Hạn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const dueDate = task.dueAt ? new Date(task.dueAt) : null;
                    const isDone = task.status === "DONE" || task.status === "CANCELLED";
                    const isOverdue = dueDate ? dueDate.getTime() < now.getTime() && !isDone : false;
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Link href={`/work/tasks/${task.id}`} className="font-medium hover:underline">
                            {task.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                            <TaskStatusBadge status={task.status as TaskStatus} />
                            <TaskPriorityBadge priority={task.priority as TaskPriority} />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <TaskStatusBadge status={task.status as TaskStatus} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <TaskPriorityBadge priority={task.priority as TaskPriority} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar size="sm">
                                <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                                <AvatarFallback>{task.assignee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Chưa gán</span>
                          )}
                        </TableCell>
                        <TableCell className={cn("text-sm", isOverdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                          {dueDate ? dueDate.toLocaleDateString("vi-VN") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
