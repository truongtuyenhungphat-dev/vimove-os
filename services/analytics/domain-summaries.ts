import "server-only";
import { prisma } from "@/lib/db/client";

export async function getWorkSummary(organizationId: string) {
  const [total, done, overdue] = await Promise.all([
    prisma.task.count({ where: { organizationId } }),
    prisma.task.count({ where: { organizationId, status: "DONE" } }),
    prisma.task.count({ where: { organizationId, status: { notIn: ["DONE", "CANCELLED"] }, dueAt: { lt: new Date() } } }),
  ]);
  return { total, done, overdue, completionRate: total > 0 ? (done / total) * 100 : 0 };
}

export async function getContentSummary(organizationId: string) {
  const rows = await prisma.content.groupBy({ by: ["status"], where: { organizationId }, _count: true });
  const total = rows.reduce((sum, r) => sum + r._count, 0);
  const published = rows.find((r) => r.status === "PUBLISHED")?._count ?? 0;
  return { total, published, byStatus: rows.map((r) => ({ status: r.status, count: r._count })) };
}

export async function getSalesSummary(organizationId: string) {
  const orders = await prisma.order.findMany({ where: { organizationId, status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { totalAmount: true } });
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const customerCount = await prisma.customer.count({ where: { organizationId } });
  return {
    orderCount: orders.length,
    totalRevenue,
    aov: orders.length > 0 ? totalRevenue / orders.length : 0,
    customerCount,
  };
}

export async function getExecutiveSummary(organizationId: string) {
  const [users, leadCount, wonLeadCount, pipelineValueAgg] = await Promise.all([
    prisma.user.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.lead.count({ where: { organizationId } }),
    prisma.lead.count({ where: { organizationId, stage: { type: "WON" } } }),
    prisma.lead.aggregate({ where: { organizationId, stage: { type: "OPEN" } }, _sum: { value: true } }),
  ]);
  return {
    activeUsers: users,
    leadCount,
    wonLeadCount,
    winRate: leadCount > 0 ? (wonLeadCount / leadCount) * 100 : 0,
    openPipelineValue: Number(pipelineValueAgg._sum.value ?? 0),
  };
}
