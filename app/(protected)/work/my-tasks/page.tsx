import type { Metadata } from "next";
import { ListTodo, AlarmClockOff, CalendarClock, CheckCircle2 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listMyTasks } from "@/services/tasks/tasks";
import { listTaskTemplates } from "@/services/tasks/templates";
import { listTags } from "@/services/tasks/tags";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { TaskDialog } from "@/components/work/task-dialog";
import { MyTasksBoard } from "@/components/work/my-tasks-board";
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

  const now = new Date();
  const openTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const overdue = openTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()).length;
  const dueToday = openTasks.filter(
    (t) => t.dueAt && new Date(t.dueAt).toDateString() === now.toDateString()
  ).length;
  const done = tasks.filter((t) => t.status === "DONE").length;

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Đang xử lý" value={openTasks.length} icon={ListTodo} tone={openTasks.length > 0 ? "primary" : "muted"} />
        <KpiCard label="Quá hạn" value={overdue} icon={AlarmClockOff} tone={overdue > 0 ? "warning" : "muted"} />
        <KpiCard label="Đến hạn hôm nay" value={dueToday} icon={CalendarClock} tone={dueToday > 0 ? "warning" : "muted"} />
        <KpiCard label="Đã hoàn thành" value={done} icon={CheckCircle2} tone="muted" hint={`Trên tổng ${tasks.length} việc`} />
      </div>

      <MyTasksBoard tasks={tasks} now={now} />
    </>
  );
}
