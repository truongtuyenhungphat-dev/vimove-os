import "server-only";
import { prisma } from "@/lib/db/client";

export async function writeAuditLog(params: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before === undefined ? undefined : (params.before as object),
      after: params.after === undefined ? undefined : (params.after as object),
    },
  });
}

export async function listAuditLogs(organizationId: string, take = 100) {
  return prisma.auditLog.findMany({
    where: { organizationId },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
