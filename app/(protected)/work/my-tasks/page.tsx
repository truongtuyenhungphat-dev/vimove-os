import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listMyTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskDialog } from "@/components/work/task-dialog";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/work/task-badges";
import { createTaskAction } from "../tasks/actions";
import type { TaskPriority } from "@/lib/work/types";

export const metadata: Metadata = { title: "Việc của tôi — VIMOVE OS" };

export default async function MyTasksPage() {
  const session = await requirePermission("tasks.read");
  const canCreate = hasPermission(session, "tasks.create");

  const [tasks, users, teams, templates, tags] = await Promise.all([
    listMyTasks(session.user.organizationId, session.user.id),
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
        title="Việc của tôi"
        description="Công việc được giao cho bạn"
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

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="Bạn chưa có công việc nào"
                description="Công việc được gán cho bạn sẽ hiện ở đây."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
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
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <TaskPriorityBadge priority={task.priority} />
                    </TableCell>
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
