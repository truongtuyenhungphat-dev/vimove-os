import type { Metadata } from "next";
import { LayoutGrid, AlarmClockOff, UserX, CheckCircle2 } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { getKanbanBoard } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { TaskFilters } from "@/components/work/task-filters";
import { TaskDialog } from "@/components/work/task-dialog";
import { KanbanBoard } from "@/components/work/kanban-board";
import { createTaskAction } from "../tasks/actions";
import { moveTaskStatusAction } from "./actions";
import type { TaskPriority, TaskStatus } from "@/lib/work/types";

export const metadata: Metadata = { title: "Kanban — VIMOVE OS" };

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assigneeId?: string; tagId?: string; search?: string }>;
}) {
  const session = await requirePermission("tasks.read");
  const canCreate = hasPermission(session, "tasks.create");
  const params = await searchParams;
  const visibility = buildVisibilityScope(session, "tasks.read");

  const [board, users, teams, templates, tags] = await Promise.all([
    getKanbanBoard(session.user.organizationId, {
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
  const allVisible = Object.values(board).flat();
  const openTasks = allVisible.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const overdue = openTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()).length;
  const unassigned = openTasks.filter((t) => !t.assignee).length;

  return (
    <>
      <PageHeader
        title="Kanban"
        description="Kéo thả để đổi trạng thái công việc"
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
        <KpiCard label="Tổng hiển thị" value={allVisible.length} icon={LayoutGrid} tone="primary" />
        <KpiCard label="Quá hạn" value={overdue} icon={AlarmClockOff} tone={overdue > 0 ? "warning" : "muted"} />
        <KpiCard label="Chưa gán người" value={unassigned} icon={UserX} tone={unassigned > 0 ? "warning" : "muted"} />
        <KpiCard label="Đã hoàn thành" value={board.DONE.length} icon={CheckCircle2} tone="muted" />
      </div>

      <TaskFilters assignees={activeUsers} tags={tags} />

      <KanbanBoard board={board} onMove={moveTaskStatusAction} taskBasePath="/work/tasks" now={now} />
    </>
  );
}
