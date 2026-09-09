import "server-only";
import { prisma } from "@/lib/db/client";

/** Phase 10 — Scale: đọc ErrorLog thật cho trang /admin/observability. */
export async function listErrorLogs(organizationId: string, take = 100) {
  return prisma.errorLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getErrorLogStats(organizationId: string) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, last24h] = await Promise.all([
    prisma.errorLog.count({ where: { organizationId } }),
    prisma.errorLog.count({ where: { organizationId, createdAt: { gte: since24h } } }),
  ]);
  return { total, last24h };
}
