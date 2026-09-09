import type { Metadata } from "next";
import { addDays, subDays } from "date-fns";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listGanttTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFilters } from "@/components/work/task-filters";
import { TaskDialog } from "@/components/work/task-dialog";
import { GanttView } from "@/components/work/gantt-view";
import { createTaskAction } from "../tasks/actions";
import { rescheduleGanttTaskAction } from "./actions";
import type { TaskPriority, TaskStatus } from "@/lib/work/types";

export const metadata: Metadata = { title: "Gantt — VIMOVE OS" };

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assigneeId?: string; tagId?: string; search?: string }>;
}) {
  const session = await requirePermission("tasks.read");
  const canCreate = hasPermission(session, "tasks.create");
  const params = await searchParams;
  const visibility = buildVisibilityScope(session, "tasks.read");

  const [tasks, users, teams, templates, tags] = await Promise.all([
    listGanttTasks(session.user.organizationId, {
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

  const ganttTasks = tasks.filter((t) => t.startAt && t.dueAt);
  const today = new Date();
  const rangeStart = ganttTasks.length
    ? subDays(new Date(Math.min(...ganttTasks.map((t) => t.startAt!.getTime()))), 2)
    : subDays(today, 14);
  const rangeEnd = ganttTasks.length
    ? addDays(new Date(Math.max(...ganttTasks.map((t) => t.dueAt!.getTime()))), 2)
    : addDays(today, 14);

  return (
    <>
      <PageHeader
        title="Gantt"
        description="Mũi tên thể hiện phụ thuộc — kéo bị giới hạn theo công việc trước đó"
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
      <GanttView
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        tasks={ganttTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status as TaskStatus,
          startAt: t.startAt!.toISOString(),
          dueAt: t.dueAt!.toISOString(),
          dependsOnIds: t.dependsOn.map((d) => d.dependsOnTaskId),
        }))}
        onReschedule={rescheduleGanttTaskAction}
        taskBasePath="/work/tasks"
      />
    </>
  );
}
