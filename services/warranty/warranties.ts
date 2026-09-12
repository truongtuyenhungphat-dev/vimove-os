import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { WarrantyStatus } from "@/lib/warranty/types";

const warrantyListInclude = {
  customer: { select: { id: true, name: true, phone: true } },
} as const;

export async function listWarranties(organizationId: string, filters: { status?: WarrantyStatus; search?: string } = {}) {
  return prisma.warranty.findMany({
    where: {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { warrantyCode: { contains: filters.search, mode: "insensitive" } },
              { productName: { contains: filters.search, mode: "insensitive" } },
              { customer: { name: { contains: filters.search, mode: "insensitive" } } },
              { customer: { phone: { contains: filters.search } } },
            ],
          }
        : {}),
    },
    include: warrantyListInclude,
    orderBy: { registeredAt: "desc" },
  });
}

export async function getWarranty(organizationId: string, id: string) {
  return prisma.warranty.findFirst({
    where: { id, organizationId },
    include: { customer: { select: { id: true, name: true, phone: true, email: true, address: true } } },
  });
}

/** Tra cứu công khai theo mã bảo hành — dùng cho cổng tra cứu (chưa dựng UI,
 * service sẵn sàng trước). Không lọc theo organizationId vì người tra cứu
 * (khách hàng ẩn danh) không có phiên đăng nhập/organization context — an
 * toàn vì warrantyCode là @unique toàn hệ thống, không đoán được bản ghi
 * khác qua tham số này. */
export async function findWarrantyByCode(warrantyCode: string) {
  return prisma.warranty.findUnique({
    where: { warrantyCode },
    include: { customer: { select: { name: true, phone: true } } },
  });
}

export async function createWarranty(
  organizationId: string,
  actorId: string,
  data: {
    customerId: string;
    productId?: string | null;
    productName: string;
    color?: string | null;
    size?: string | null;
    purchaseChannel?: string | null;
    purchaseDate?: Date | null;
    warrantyExpiry?: Date | null;
    warrantyCode: string;
    status?: WarrantyStatus;
    notes?: string | null;
  },
) {
  const existing = await prisma.warranty.findUnique({ where: { warrantyCode: data.warrantyCode } });
  if (existing) throw new Error("Mã bảo hành này đã tồn tại");

  const warranty = await prisma.warranty.create({
    data: {
      organizationId,
      customerId: data.customerId,
      productId: data.productId || null,
      productName: data.productName,
      color: data.color || null,
      size: data.size || null,
      purchaseChannel: data.purchaseChannel || null,
      purchaseDate: data.purchaseDate ?? null,
      warrantyExpiry: data.warrantyExpiry ?? null,
      warrantyCode: data.warrantyCode,
      status: data.status ?? "ACTIVE",
      notes: data.notes || null,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "warranty.create", entityType: "Warranty", entityId: warranty.id, after: { warrantyCode: warranty.warrantyCode } });
  return warranty;
}

export async function updateWarranty(
  organizationId: string,
  actorId: string,
  id: string,
  data: {
    customerId: string;
    productId?: string | null;
    productName: string;
    color?: string | null;
    size?: string | null;
    purchaseChannel?: string | null;
    purchaseDate?: Date | null;
    warrantyExpiry?: Date | null;
    status: WarrantyStatus;
    notes?: string | null;
  },
) {
  const before = await prisma.warranty.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy bảo hành");

  const updated = await prisma.warranty.update({
    where: { id },
    data: {
      customerId: data.customerId,
      productId: data.productId || null,
      productName: data.productName,
      color: data.color || null,
      size: data.size || null,
      purchaseChannel: data.purchaseChannel || null,
      purchaseDate: data.purchaseDate ?? null,
      warrantyExpiry: data.warrantyExpiry ?? null,
      status: data.status,
      notes: data.notes || null,
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "warranty.update",
    entityType: "Warranty",
    entityId: id,
    before: { status: before.status },
    after: { status: updated.status },
  });
  return updated;
}

export async function deleteWarranty(organizationId: string, actorId: string, id: string) {
  const before = await prisma.warranty.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy bảo hành");
  await prisma.warranty.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "warranty.delete", entityType: "Warranty", entityId: id, before: { warrantyCode: before.warrantyCode } });
}
