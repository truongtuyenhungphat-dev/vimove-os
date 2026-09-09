import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "./audit";

export async function listTeams(organizationId: string) {
  return prisma.team.findMany({
    where: { organizationId },
    include: {
      department: { select: { id: true, name: true } },
      members: { select: { userId: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTeam(organizationId: string, id: string) {
  return prisma.team.findFirst({
    where: { id, organizationId },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
}

export async function createTeam(
  organizationId: string,
  actorId: string,
  data: { name: string; departmentId?: string | null }
) {
  const team = await prisma.team.create({
    data: { organizationId, name: data.name, departmentId: data.departmentId || null },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "team.create",
    entityType: "Team",
    entityId: team.id,
    after: team,
  });
  return team;
}

export async function updateTeam(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; departmentId?: string | null }
) {
  const before = await prisma.team.findFirst({ where: { id, organizationId } });
  const team = await prisma.team.update({
    where: { id },
    data: { name: data.name, departmentId: data.departmentId || null },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "team.update",
    entityType: "Team",
    entityId: team.id,
    before,
    after: team,
  });
  return team;
}

export async function deleteTeam(organizationId: string, actorId: string, id: string) {
  const before = await prisma.team.findFirst({ where: { id, organizationId } });
  await prisma.team.delete({ where: { id } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "team.delete",
    entityType: "Team",
    entityId: id,
    before,
  });
}

export async function setTeamMembers(
  organizationId: string,
  actorId: string,
  teamId: string,
  userIds: string[]
) {
  const before = await prisma.teamMember.findMany({ where: { teamId } });
  await prisma.$transaction([
    prisma.teamMember.deleteMany({ where: { teamId } }),
    prisma.teamMember.createMany({
      data: userIds.map((userId) => ({ teamId, userId })),
      skipDuplicates: true,
    }),
  ]);
  await writeAuditLog({
    organizationId,
    actorId,
    action: "team.members.update",
    entityType: "Team",
    entityId: teamId,
    before,
    after: userIds,
  });
}
