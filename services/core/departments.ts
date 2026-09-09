import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "./audit";

export async function listDepartments(organizationId: string) {
  return prisma.department.findMany({
    where: { organizationId },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { users: true, teams: true, children: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartment(organizationId: string, id: string) {
  return prisma.department.findFirst({ where: { id, organizationId } });
}

export async function createDepartment(
  organizationId: string,
  actorId: string,
  data: { name: string; parentId?: string | null }
) {
  const department = await prisma.department.create({
    data: { organizationId, name: data.name, parentId: data.parentId || null },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "department.create",
    entityType: "Department",
    entityId: department.id,
    after: department,
  });
  return department;
}

export async function updateDepartment(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; parentId?: string | null }
) {
  const before = await getDepartment(organizationId, id);
  const department = await prisma.department.update({
    where: { id },
    data: { name: data.name, parentId: data.parentId || null },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "department.update",
    entityType: "Department",
    entityId: department.id,
    before,
    after: department,
  });
  return department;
}

export async function deleteDepartment(organizationId: string, actorId: string, id: string) {
  const before = await getDepartment(organizationId, id);
  await prisma.department.delete({ where: { id } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "department.delete",
    entityType: "Department",
    entityId: id,
    before,
  });
}
