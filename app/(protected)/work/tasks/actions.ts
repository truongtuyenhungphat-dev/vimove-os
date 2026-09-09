"use server";

import { z } from "zod";
import { assertPermission } from "@/lib/auth/rbac";
import { createTask, updateTask, deleteTask, moveTaskStatus, assertTaskInOrganization } from "@/services/tasks/tasks";
import { addChecklistItem, toggleChecklistItem, removeChecklistItem } from "@/services/tasks/checklist";
import { addComment, deleteComment } from "@/services/tasks/comments";
import { addAttachmentLink, removeAttachment } from "@/services/tasks/attachments";
import { addDependency, removeDependency } from "@/services/tasks/dependencies";
import { toggleWatcher } from "@/services/tasks/watchers";
import { addTimeLog, removeTimeLog } from "@/services/tasks/time-logs";
import { setTaskTags } from "@/services/tasks/tags";
import { createApprovalRequest } from "@/services/process/approvals";
import { revalidateWorkViews } from "@/lib/work/revalidate";
import type { TaskStatus } from "@/lib/work/types";
import type { ApprovalMode } from "@/lib/process/types";
import { revalidatePath } from "next/cache";

const optionalDate = z.preprocess((v) => (v ? new Date(String(v)) : null), z.date().nullable());
const optionalHours = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
);

const taskSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tiêu đề"),
  description: z.string().trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  startAt: optionalDate,
  dueAt: optionalDate,
  estimateHours: optionalHours,
});

function parseTaskForm(formData: FormData) {
  return taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority"),
    assigneeId: formData.get("assigneeId") || undefined,
    teamId: formData.get("teamId") || undefined,
    projectId: formData.get("projectId") || undefined,
    startAt: formData.get("startAt") || undefined,
    dueAt: formData.get("dueAt") || undefined,
    estimateHours: formData.get("estimateHours") ?? undefined,
  });
}

function parseList(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter((v) => v.trim());
}

export async function createTaskAction(formData: FormData) {
  const session = await assertPermission("tasks.create");
  const parsed = parseTaskForm(formData);
  await createTask(session.user.organizationId, session.user.id, {
    title: parsed.title,
    description: parsed.description || null,
    priority: parsed.priority,
    assigneeId: parsed.assigneeId || null,
    teamId: parsed.teamId || null,
    projectId: parsed.projectId || null,
    startAt: parsed.startAt,
    dueAt: parsed.dueAt,
    estimateHours: parsed.estimateHours ?? null,
    checklistItems: parseList(formData, "checklistItems"),
    tagIds: parseList(formData, "tagIds"),
  });
  revalidateWorkViews();
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const session = await assertPermission("tasks.update");
  const parsed = parseTaskForm(formData);
  await updateTask(session.user.organizationId, session.user.id, taskId, {
    title: parsed.title,
    description: parsed.description || null,
    priority: parsed.priority,
    assigneeId: parsed.assigneeId || null,
    teamId: parsed.teamId || null,
    projectId: parsed.projectId || null,
    startAt: parsed.startAt,
    dueAt: parsed.dueAt,
    estimateHours: parsed.estimateHours ?? null,
  });
  await setTaskTags(taskId, parseList(formData, "tagIds"));
  revalidateWorkViews(taskId);
}

export async function deleteTaskAction(taskId: string) {
  const session = await assertPermission("tasks.delete");
  await deleteTask(session.user.organizationId, session.user.id, taskId);
  revalidateWorkViews(taskId);
}

export async function changeTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await assertPermission("tasks.update");
  await moveTaskStatus(session.user.organizationId, session.user.id, taskId, { status, targetIndex: 0 });
  revalidateWorkViews(taskId);
}

export async function toggleWatcherAction(taskId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  const result = await toggleWatcher(taskId, session.user.id);
  revalidateWorkViews(taskId);
  return result;
}

export async function addChecklistItemAction(taskId: string, title: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await addChecklistItem(taskId, session.user.id, title);
  revalidateWorkViews(taskId);
}

export async function toggleChecklistItemAction(taskId: string, itemId: string, isDone: boolean) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await toggleChecklistItem(taskId, session.user.id, itemId, isDone);
  revalidateWorkViews(taskId);
}

export async function removeChecklistItemAction(taskId: string, itemId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await removeChecklistItem(taskId, session.user.id, itemId);
  revalidateWorkViews(taskId);
}

export async function addCommentAction(taskId: string, body: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  const parsed = z.string().trim().min(1).parse(body);
  await addComment(taskId, session.user.id, parsed);
  revalidateWorkViews(taskId);
}

export async function deleteCommentAction(taskId: string, commentId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await deleteComment(taskId, commentId);
  revalidateWorkViews(taskId);
}

export async function addAttachmentAction(taskId: string, data: { label: string; url: string }) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  const parsed = z
    .object({ label: z.string().trim().min(1), url: z.string().trim().url("URL không hợp lệ") })
    .parse(data);
  await addAttachmentLink(taskId, session.user.id, parsed);
  revalidateWorkViews(taskId);
}

export async function removeAttachmentAction(taskId: string, attachmentId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await removeAttachment(taskId, session.user.id, attachmentId);
  revalidateWorkViews(taskId);
}

export async function addDependencyAction(taskId: string, dependsOnTaskId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await addDependency(session.user.organizationId, session.user.id, taskId, dependsOnTaskId);
  revalidateWorkViews(taskId);
}

export async function removeDependencyAction(taskId: string, dependencyId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await removeDependency(taskId, session.user.id, dependencyId);
  revalidateWorkViews(taskId);
}

export async function addTimeLogAction(taskId: string, data: { minutes: number; note: string | null }) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  const parsed = z.object({ minutes: z.number().int().positive(), note: z.string().nullable() }).parse(data);
  await addTimeLog(taskId, session.user.id, { ...parsed, loggedAt: new Date() });
  revalidateWorkViews(taskId);
}

export async function removeTimeLogAction(taskId: string, logId: string) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await removeTimeLog(logId);
  revalidateWorkViews(taskId);
}

export async function requestApprovalAction(
  taskId: string,
  taskTitle: string,
  data: { mode: ApprovalMode; slaHours: number | null; approverIds: string[] }
) {
  const session = await assertPermission("tasks.update");
  await assertTaskInOrganization(session.user.organizationId, taskId);
  await createApprovalRequest(session.user.organizationId, session.user.id, {
    entityType: "TASK",
    entityId: taskId,
    title: taskTitle,
    mode: data.mode,
    slaHours: data.slaHours,
    approverIds: data.approverIds,
  });
  revalidatePath("/work/approvals");
}
