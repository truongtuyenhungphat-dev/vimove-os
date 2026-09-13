import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { writeEvent } from "@/services/analytics/events";
import type { OrderStatus } from "@/lib/sales/types";

const orderListInclude = {
  customer: { select: { id: true, name: true } },
  channel: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} as const;

function serializeOrder<T extends { totalAmount: unknown }>(order: T) {
  return { ...order, totalAmount: Number(order.totalAmount) };
}

export async function listOrders(organizationId: string, filters: { status?: OrderStatus; customerId?: string } = {}) {
  const orders = await prisma.order.findMany({
    where: { organizationId, ...(filters.status ? { status: filters.status } : {}), ...(filters.customerId ? { customerId: filters.customerId } : {}) },
    include: orderListInclude,
    orderBy: { orderDate: "desc" },
  });
  return orders.map(serializeOrder);
}

/** Dải KPI đầu trang danh sách đơn hàng — dùng aggregate/count, không kéo
 * toàn bộ bản ghi về app layer. */
export async function getOrdersSummary(organizationId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const revenueFilter = { organizationId, status: { notIn: ["CANCELLED", "REFUNDED"] as OrderStatus[] } };

  const [ordersThisMonth, monthAgg, pendingFulfillment, allAgg] = await Promise.all([
    prisma.order.count({ where: { organizationId, orderDate: { gte: startOfMonth } } }),
    prisma.order.aggregate({ where: { ...revenueFilter, orderDate: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { organizationId, status: "CONFIRMED" } }),
    prisma.order.aggregate({ where: revenueFilter, _sum: { totalAmount: true }, _count: true }),
  ]);

  const totalRevenue = Number(allAgg._sum.totalAmount ?? 0);
  return {
    ordersThisMonth,
    revenueThisMonth: Number(monthAgg._sum.totalAmount ?? 0),
    pendingFulfillment,
    aov: allAgg._count > 0 ? totalRevenue / allAgg._count : 0,
  };
}

export async function getOrder(organizationId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, organizationId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      channel: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { id: "asc" } },
    },
  });
  if (!order) return null;
  return {
    ...serializeOrder(order),
    items: order.items.map((it) => ({ ...it, unitPrice: Number(it.unitPrice), lineTotal: Number(it.lineTotal) })),
  };
}

/** unitPrice luôn snapshot từ Product.price tại thời điểm tạo đơn (§ ghi chú schema)
 * — không đọc lại giá sau này dù Product.price đổi. */
export async function createOrder(
  organizationId: string,
  actorId: string,
  data: {
    customerId: string;
    channelId?: string | null;
    orderDate?: Date;
    notes?: string | null;
    items: { productId: string; quantity: number }[];
  }
) {
  if (data.items.length === 0) throw new Error("Đơn hàng phải có ít nhất 1 sản phẩm");

  const products = await prisma.product.findMany({
    where: { organizationId, id: { in: data.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const itemsData = data.items.map((i) => {
    const product = productMap.get(i.productId);
    if (!product) throw new Error("Sản phẩm không hợp lệ");
    const unitPrice = Number(product.price);
    return { productId: i.productId, quantity: i.quantity, unitPrice, lineTotal: unitPrice * i.quantity };
  });
  const totalAmount = itemsData.reduce((sum, i) => sum + i.lineTotal, 0);

  const order = await prisma.order.create({
    data: {
      organizationId,
      customerId: data.customerId,
      channelId: data.channelId || null,
      ownerId: actorId,
      orderDate: data.orderDate ?? new Date(),
      notes: data.notes || null,
      totalAmount,
      items: { create: itemsData },
    },
    include: { items: true },
  });
  await writeAuditLog({ organizationId, actorId, action: "order.create", entityType: "Order", entityId: order.id, after: { totalAmount } });
  await writeEvent({ organizationId, type: "order.created", entityType: "Order", entityId: order.id, payload: { totalAmount }, occurredAt: order.orderDate });
  return order;
}

export async function updateOrderStatus(organizationId: string, actorId: string, id: string, status: OrderStatus) {
  const before = await prisma.order.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy đơn hàng");
  const updated = await prisma.order.update({ where: { id }, data: { status } });
  await writeAuditLog({ organizationId, actorId, action: "order.status_change", entityType: "Order", entityId: id, before: { status: before.status }, after: { status } });
  return updated;
}

export async function deleteOrder(organizationId: string, actorId: string, id: string) {
  const before = await prisma.order.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy đơn hàng");
  if (before.status !== "DRAFT") throw new Error("Chỉ có thể xoá đơn hàng ở trạng thái Nháp");
  await prisma.order.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "order.delete", entityType: "Order", entityId: id, before: { totalAmount: Number(before.totalAmount) } });
}
