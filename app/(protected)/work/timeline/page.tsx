import type { Metadata } from "next";
import { addDays, subDays } from "date-fns";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { listAllTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFilters } from "@/components/work/task-filters";
import { TaskDialog } from "@/components/work/task-dialog";
import { TimelineView } from "@/components/work/timeline-view";
import { createTaskAction } from "../tasks/actions";
import { rescheduleTimelineTaskAction } from "./actions";
import type { TaskPriority, TaskStatus } from "@/lib/work/types";

export const metadata: Metadata = { title: "Timeline — VIMOVE OS" };

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assigneeId?: string; tagId?: string; search?: string }>;
}) {
  const session = await requirePermission("tasks.read");
  const canCreate = hasPermission(session, "tasks.create");
  const params = await searchParams;
  const visibility = buildVisibilityScope(session, "tasks.read");

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

  const timelineTasks = tasks.filter((t) => t.startAt && t.dueAt);
  const today = new Date();
  const rangeStart = timelineTasks.length
    ? subDays(new Date(Math.min(...timelineTasks.map((t) => t.startAt!.getTime()))), 2)
    : subDays(today, 14);
  const rangeEnd = timelineTasks.length
    ? addDays(new Date(Math.max(...timelineTasks.map((t) => t.dueAt!.getTime()))), 2)
    : addDays(today, 14);

  return (
    <>
      <PageHeader
        title="Timeline"
        description="Kéo cả thanh để dời khoảng ngày (không ràng buộc phụ thuộc — dùng Gantt cho việc có phụ thuộc)"
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
      <TimelineView
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        tasks={timelineTasks.map((t) => ({ id: t.id, title: t.title, startAt: t.startAt!.toISOString(), dueAt: t.dueAt!.toISOString() }))}
        onReschedule={rescheduleTimelineTaskAction}
        taskBasePath="/work/tasks"
      />
    </>
  );
}
