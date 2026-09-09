import type { Metadata } from "next";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { getKanbanBoard } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
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

      <TaskFilters assignees={activeUsers} tags={tags} />

      <KanbanBoard board={board} onMove={moveTaskStatusAction} taskBasePath="/work/tasks" now={new Date()} />
    </>
  );
}
