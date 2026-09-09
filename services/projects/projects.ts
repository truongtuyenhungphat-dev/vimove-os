import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { ProjectStatus } from "@/lib/process/types";

const projectListInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { members: true, tasks: true, milestones: true } },
} as const;

export async function listProjects(organizationId: string, filters: { status?: ProjectStatus } = {}) {
  return prisma.project.findMany({
    where: { organizationId, ...(filters.status ? { status: filters.status } : {}) },
    include: projectListInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Dự án mà user là owner hoặc member — dùng cho "Dự án của tôi". */
export async function listMyProjects(organizationId: string, userId: string) {
  return prisma.project.findMany({
    where: { organizationId, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: projectListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(organizationId: string, id: string) {
  return prisma.project.findFirst({
    where: { id, organizationId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
      milestones: { orderBy: { position: "asc" } },
      files: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      tasks: {
        select: { id: true, title: true, status: true, priority: true, dueAt: true, assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { members: true, tasks: true, milestones: true } },
    },
  });
}

export async function assertProjectInOrganization(organizationId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } });
  if (!project) throw new Error("Không tìm thấy dự án");
  return project;
}

export async function createProject(
  organizationId: string,
  actorId: string,
  data: { name: string; description?: string | null; startAt?: Date | null; endAt?: Date | null; memberIds?: string[] }
) {
  const project = await prisma.project.create({
    data: {
      organizationId,
      name: data.name,
      description: data.description || null,
      ownerId: actorId,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
      members: {
        create: [
          { userId: actorId, role: "OWNER" },
          ...(data.memberIds ?? []).filter((id) => id !== actorId).map((userId) => ({ userId, role: "MEMBER" as const })),
        ],
      },
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "project.create", entityType: "Project", entityId: project.id, after: { name: project.name } });
  return project;
}

export async function updateProject(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; description?: string | null; status: ProjectStatus; startAt?: Date | null; endAt?: Date | null }
) {
  const before = await prisma.project.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy dự án");

  const updated = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "project.update",
    entityType: "Project",
    entityId: id,
    before: { name: before.name, status: before.status },
    after: { name: updated.name, status: updated.status },
  });
  return updated;
}

export async function deleteProject(organizationId: string, actorId: string, id: string) {
  const before = await prisma.project.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy dự án");
  await prisma.project.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "project.delete", entityType: "Project", entityId: id, before: { name: before.name } });
}

export async function addMember(projectId: string, userId: string, role: "MEMBER" | "VIEWER" = "MEMBER") {
  return prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { role },
    create: { projectId, userId, role },
  });
}

export async function removeMember(projectId: string, userId: string) {
  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
}

export async function addMilestone(projectId: string, data: { name: string; dueAt?: Date | null }) {
  const last = await prisma.projectMilestone.findFirst({ where: { projectId }, orderBy: { position: "desc" } });
  return prisma.projectMilestone.create({
    data: { projectId, name: data.name, dueAt: data.dueAt ?? null, position: (last?.position ?? -1) + 1 },
  });
}

export async function toggleMilestone(id: string, done: boolean) {
  return prisma.projectMilestone.update({ where: { id }, data: { status: done ? "DONE" : "PENDING" } });
}

export async function removeMilestone(id: string) {
  await prisma.projectMilestone.delete({ where: { id } });
}

export async function addFileLink(projectId: string, uploaderId: string, data: { label: string; url: string }) {
  return prisma.projectFile.create({ data: { projectId, uploaderId, label: data.label, url: data.url } });
}

export async function removeFile(id: string) {
  await prisma.projectFile.delete({ where: { id } });
}
