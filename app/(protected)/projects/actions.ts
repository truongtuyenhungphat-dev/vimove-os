"use server";

import { z } from "zod";
import { assertPermission } from "@/lib/auth/rbac";
import {
  createProject,
  updateProject,
  deleteProject,
  assertProjectInOrganization,
  addMember,
  removeMember,
  addMilestone,
  toggleMilestone,
  removeMilestone,
  addFileLink,
  removeFile,
} from "@/services/projects/projects";
import { revalidatePath } from "next/cache";

const optionalDate = z.preprocess((v) => (v ? new Date(String(v)) : null), z.date().nullable());

const projectSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên dự án"),
  description: z.string().trim().optional(),
  startAt: optionalDate,
  endAt: optionalDate,
});

function parseList(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter((v) => v.trim());
}

function revalidateProjectViews(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/projects/my");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createProjectAction(formData: FormData) {
  const session = await assertPermission("projects.create");
  const parsed = projectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    startAt: formData.get("startAt") || undefined,
    endAt: formData.get("endAt") || undefined,
  });
  await createProject(session.user.organizationId, session.user.id, { ...parsed, memberIds: parseList(formData, "memberIds") });
  revalidateProjectViews();
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const session = await assertPermission("projects.update");
  const parsed = projectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    startAt: formData.get("startAt") || undefined,
    endAt: formData.get("endAt") || undefined,
  });
  const status = z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).parse(formData.get("status"));
  await updateProject(session.user.organizationId, session.user.id, projectId, { ...parsed, status });
  revalidateProjectViews(projectId);
}

export async function deleteProjectAction(projectId: string) {
  const session = await assertPermission("projects.delete");
  await deleteProject(session.user.organizationId, session.user.id, projectId);
  revalidateProjectViews(projectId);
}

export async function addMemberAction(projectId: string, userId: string) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await addMember(projectId, userId);
  revalidateProjectViews(projectId);
}

export async function removeMemberAction(projectId: string, userId: string) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await removeMember(projectId, userId);
  revalidateProjectViews(projectId);
}

export async function addMilestoneAction(projectId: string, name: string, dueAt: string | null) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await addMilestone(projectId, { name, dueAt: dueAt ? new Date(dueAt) : null });
  revalidateProjectViews(projectId);
}

export async function toggleMilestoneAction(projectId: string, id: string, done: boolean) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await toggleMilestone(id, done);
  revalidateProjectViews(projectId);
}

export async function removeMilestoneAction(projectId: string, id: string) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await removeMilestone(id);
  revalidateProjectViews(projectId);
}

export async function addFileLinkAction(projectId: string, data: { label: string; url: string }) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  const parsed = z.object({ label: z.string().trim().min(1), url: z.string().trim().url("URL không hợp lệ") }).parse(data);
  await addFileLink(projectId, session.user.id, parsed);
  revalidateProjectViews(projectId);
}

export async function removeFileAction(projectId: string, id: string) {
  const session = await assertPermission("projects.update");
  await assertProjectInOrganization(session.user.organizationId, projectId);
  await removeFile(id);
  revalidateProjectViews(projectId);
}
