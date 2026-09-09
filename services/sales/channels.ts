import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { SalesChannelType } from "@/lib/sales/types";

export async function listSalesChannels(organizationId: string) {
  return prisma.salesChannel.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
}

export async function createSalesChannel(organizationId: string, actorId: string, data: { name: string; type: SalesChannelType }) {
  const channel = await prisma.salesChannel.create({ data: { organizationId, name: data.name, type: data.type } });
  await writeAuditLog({ organizationId, actorId, action: "sales_channel.create", entityType: "SalesChannel", entityId: channel.id, after: { name: channel.name } });
  return channel;
}

export async function updateSalesChannel(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; type: SalesChannelType; isActive: boolean }
) {
  const before = await prisma.salesChannel.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy kênh bán");
  const updated = await prisma.salesChannel.update({ where: { id }, data: { name: data.name, type: data.type, isActive: data.isActive } });
  await writeAuditLog({ organizationId, actorId, action: "sales_channel.update", entityType: "SalesChannel", entityId: id, before: { name: before.name }, after: { name: updated.name } });
  return updated;
}

export async function deleteSalesChannel(organizationId: string, actorId: string, id: string) {
  const before = await prisma.salesChannel.findFirst({ where: { id, organizationId }, include: { _count: { select: { orders: true } } } });
  if (!before) throw new Error("Không tìm thấy kênh bán");
  if (before._count.orders > 0) throw new Error("Kênh bán đang có đơn hàng, không thể xoá");
  await prisma.salesChannel.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "sales_channel.delete", entityType: "SalesChannel", entityId: id, before: { name: before.name } });
}
