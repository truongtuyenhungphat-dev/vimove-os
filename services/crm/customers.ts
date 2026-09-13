import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";

export async function listCustomers(organizationId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      organizationId,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] }
        : {}),
    },
    include: { owner: { select: { id: true, name: true } }, _count: { select: { leads: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Dải KPI đầu trang danh sách khách hàng — 3 count query đơn giản, không kéo
 * toàn bộ bản ghi. */
export async function getCustomersSummary(organizationId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [total, newThisMonth, withOrders] = await Promise.all([
    prisma.customer.count({ where: { organizationId } }),
    prisma.customer.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
    prisma.customer.count({ where: { organizationId, orders: { some: {} } } }),
  ]);
  return { total, newThisMonth, withOrders };
}

/** Customer 360: profile + leads + orders + LTV (tổng tiền các order không bị huỷ/hoàn). */
export async function getCustomer360(organizationId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      leads: {
        include: { stage: { select: { id: true, name: true, type: true } } },
        orderBy: { createdAt: "desc" },
      },
      orders: {
        include: { channel: { select: { id: true, name: true } }, items: { select: { id: true } } },
        orderBy: { orderDate: "desc" },
      },
    },
  });
  if (!customer) return null;

  const revenue = customer.orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return {
    ...customer,
    leads: customer.leads.map((l) => ({ ...l, value: l.value === null ? null : Number(l.value) })),
    orders: customer.orders.map(({ items, ...o }) => ({ ...o, totalAmount: Number(o.totalAmount), itemCount: items.length })),
    stats: {
      totalRevenue: revenue,
      orderCount: customer.orders.length,
      leadCount: customer.leads.length,
      wonLeadCount: customer.leads.filter((l) => l.stage.type === "WON").length,
    },
  };
}

export async function createCustomer(
  organizationId: string,
  actorId: string,
  data: { name: string; email?: string | null; phone?: string | null; company?: string | null; address?: string | null; ownerId?: string | null }
) {
  const customer = await prisma.customer.create({
    data: {
      organizationId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      ownerId: data.ownerId || actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "customer.create", entityType: "Customer", entityId: customer.id, after: { name: customer.name } });
  return customer;
}

export async function updateCustomer(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; email?: string | null; phone?: string | null; company?: string | null; address?: string | null; ownerId?: string | null }
) {
  const before = await prisma.customer.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy khách hàng");
  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      ownerId: data.ownerId || null,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "customer.update", entityType: "Customer", entityId: id, before: { name: before.name }, after: { name: updated.name } });
  return updated;
}

export async function deleteCustomer(organizationId: string, actorId: string, id: string) {
  const before = await prisma.customer.findFirst({ where: { id, organizationId }, include: { _count: { select: { orders: true } } } });
  if (!before) throw new Error("Không tìm thấy khách hàng");
  if (before._count.orders > 0) throw new Error("Khách hàng đang có đơn hàng, không thể xoá");
  await prisma.customer.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "customer.delete", entityType: "Customer", entityId: id, before: { name: before.name } });
}
