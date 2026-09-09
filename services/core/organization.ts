import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "./audit";

export async function getOrganization(organizationId: string) {
  return prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
}

export async function updateOrganization(
  organizationId: string,
  actorId: string,
  data: { name: string }
) {
  const before = await getOrganization(organizationId);
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { name: data.name },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "organization.update",
    entityType: "Organization",
    entityId: organizationId,
    before,
    after: org,
  });
  return org;
}

export async function getDashboardCounts(organizationId: string, userId: string) {
  const [users, departments, teams, pendingApprovals] = await Promise.all([
    prisma.user.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.department.count({ where: { organizationId } }),
    prisma.team.count({ where: { organizationId } }),
    // Approval Hub (Phase 3): số bước đang chờ CHÍNH user này duyệt (đến lượt), không
    // phải tổng toàn tổ chức — số thật, không phải giá trị giả như Phase 1.
    prisma.approvalStep.count({
      where: { approverId: userId, status: "PENDING", approvalRequest: { organizationId, status: "PENDING" } },
    }),
  ]);
  return { users, departments, teams, pendingApprovals };
}
