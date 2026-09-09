import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getTask, listAllTasks } from "@/services/tasks/tasks";
import { listUsers } from "@/services/core/users";
import { listTeams } from "@/services/core/teams";
import { listProjects } from "@/services/projects/projects";
import { listTags } from "@/services/tasks/tags";
import { PageHeader } from "@/components/shared/page-header";
import { TaskStatusBadge } from "@/components/work/task-badges";
import { TaskDetailView } from "@/components/work/task-detail/task-detail-view";
import type { TaskPriority, TaskStatus } from "@/lib/work/types";
import {
  updateTaskAction,
  deleteTaskAction,
  changeTaskStatusAction,
  toggleWatcherAction,
  addChecklistItemAction,
  toggleChecklistItemAction,
  removeChecklistItemAction,
  addCommentAction,
  deleteCommentAction,
  addAttachmentAction,
  removeAttachmentAction,
  addDependencyAction,
  removeDependencyAction,
  addTimeLogAction,
  removeTimeLogAction,
  requestApprovalAction,
} from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ taskId: string }>;
}): Promise<Metadata> {
  const { taskId } = await params;
  return { title: `Công việc — VIMOVE OS`, description: taskId };
}

const toDateInputValue = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : null);

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const session = await requirePermission("tasks.read");
  const { taskId } = await params;

  const task = await getTask(session.user.organizationId, taskId);
  if (!task) notFound();

  const canEdit = hasPermission(session, "tasks.update");
  const canDelete = hasPermission(session, "tasks.delete");

  const [users, teams, projects, tags, allTasks] = await Promise.all([
    listUsers(session.user.organizationId),
    listTeams(session.user.organizationId),
    listProjects(session.user.organizationId),
    listTags(session.user.organizationId),
    listAllTasks(session.user.organizationId),
  ]);

  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const existingDependsOnIds = new Set(task.dependsOn.map((d) => d.dependsOnTaskId));
  const candidateTasks = allTasks
    .filter((t) => t.id !== taskId && !existingDependsOnIds.has(t.id))
    .map((t) => ({ id: t.id, title: t.title }));

  const isWatching = task.watchers.some((w) => w.userId === session.user.id);

  return (
    <>
      <PageHeader
        title={task.title}
        description={`Tạo bởi ${task.creator.name} · ${format(task.createdAt, "dd/MM/yyyy")}`}
        actions={<TaskStatusBadge status={task.status as TaskStatus} />}
      />

      <TaskDetailView
        task={{
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          assigneeId: task.assigneeId,
          teamId: task.teamId,
          projectId: task.projectId,
          startAt: toDateInputValue(task.startAt),
          dueAt: toDateInputValue(task.dueAt),
          estimateHours: task.estimateHours,
          tagIds: task.tags.map((t) => t.tagId),
          assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
          creator: { name: task.creator.name },
          team: task.team ? { name: task.team.name } : null,
          project: task.project ? { id: task.project.id, name: task.project.name } : null,
        }}
        currentUserId={session.user.id}
        canEdit={canEdit}
        canDelete={canDelete}
        isWatching={isWatching}
        checklistItems={task.checklistItems}
        comments={task.comments}
        attachments={task.attachments}
        dependsOn={task.dependsOn.map((d) => ({
          dependencyId: d.id,
          task: { id: d.dependsOnTask.id, title: d.dependsOnTask.title, status: d.dependsOnTask.status as TaskStatus },
        }))}
        dependents={task.dependents.map((d) => ({
          dependencyId: d.id,
          task: { id: d.task.id, title: d.task.title, status: d.task.status as TaskStatus },
        }))}
        candidateTasks={candidateTasks}
        timeLogs={task.timeLogs}
        activities={task.activities}
        assignees={activeUsers}
        teams={teamOptions}
        projects={projectOptions}
        tags={tags}
        onUpdateTask={updateTaskAction.bind(null, task.id)}
        onDeleteTask={deleteTaskAction.bind(null, task.id)}
        actions={{
          changeStatus: changeTaskStatusAction.bind(null, task.id),
          toggleWatch: toggleWatcherAction.bind(null, task.id),
          addChecklistItem: addChecklistItemAction.bind(null, task.id),
          toggleChecklistItem: toggleChecklistItemAction.bind(null, task.id),
          removeChecklistItem: removeChecklistItemAction.bind(null, task.id),
          addComment: addCommentAction.bind(null, task.id),
          deleteComment: deleteCommentAction.bind(null, task.id),
          addAttachment: addAttachmentAction.bind(null, task.id),
          removeAttachment: removeAttachmentAction.bind(null, task.id),
          addDependency: addDependencyAction.bind(null, task.id),
          removeDependency: removeDependencyAction.bind(null, task.id),
          addTimeLog: addTimeLogAction.bind(null, task.id),
          removeTimeLog: removeTimeLogAction.bind(null, task.id),
          requestApproval: requestApprovalAction.bind(null, task.id, task.title),
        }}
      />
    </>
  );
}
