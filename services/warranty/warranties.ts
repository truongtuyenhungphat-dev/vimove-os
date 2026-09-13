import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { writeEvent } from "@/services/analytics/events";
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

/** Dải KPI đầu trang danh sách bảo hành — cùng công thức "sắp hết hạn 30 ngày"
 * với services/core/dashboard.ts để số liệu nhất quán giữa Dashboard và trang này. */
export async function getWarrantySummary(organizationId: string) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const [total, active, expiringSoon, claimed] = await Promise.all([
    prisma.warranty.count({ where: { organizationId } }),
    prisma.warranty.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.warranty.count({ where: { organizationId, status: "ACTIVE", warrantyExpiry: { gte: now, lte: in30Days } } }),
    prisma.warranty.count({ where: { organizationId, status: "CLAIMED" } }),
  ]);
  return { total, active, expiringSoon, claimed };
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

/** Tra cứu công khai theo SĐT khách hàng — trả về TẤT CẢ bảo hành khớp (một
 * khách có thể đăng ký nhiều sản phẩm). Cùng lý do bỏ qua organizationId như
 * findWarrantyByCode ở trên: không có session, và SĐT không phải khoá đủ
 * nhạy cảm để cần disambiguation theo tổ chức (hệ thống hiện chỉ có 1 org). */
export async function findWarrantiesByPhoneGlobal(phone: string) {
  return prisma.warranty.findMany({
    where: { customer: { phone } },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { registeredAt: "desc" },
  });
}

const WARRANTY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm: I/O/0/1 — giữ nguyên bộ ký tự của cổng cũ (Firebase) để mã cũ/mới cùng "họ" VM-XXXXXX.

async function generateWarrantyCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "VM-";
    for (let i = 0; i < 6; i++) code += WARRANTY_CODE_CHARS[Math.floor(Math.random() * WARRANTY_CODE_CHARS.length)];
    if (!(await prisma.warranty.findUnique({ where: { warrantyCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Không tạo được mã bảo hành, vui lòng thử lại");
}

/** Đăng ký bảo hành công khai (cổng /bao-hanh, không cần đăng nhập) — tương
 * đương "Agent CRM Synchronizer" của cổng Firebase cũ: tự sinh mã, tự tìm
 * hoặc tạo Customer theo SĐT (không unique constraint nên so khớp thủ công),
 * rồi tạo Warranty. Hạn bảo hành mặc định = ngày mua + 24 tháng, giống công
 * thức cũ. Không có actorId (khách ẩn danh) nên không ghi audit log — dùng
 * writeEvent (cùng cách createLeadFromContactFormGlobal xử lý) để vẫn có vết
 * cho báo cáo/automation. */
export async function createWarrantyFromPublicFormGlobal(data: {
  organizationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  productId?: string | null;
  productName: string;
  color?: string | null;
  size?: string | null;
  purchaseChannel?: string | null;
  purchaseDate: Date;
}) {
  const existingCustomer = await prisma.customer.findFirst({
    where: { organizationId: data.organizationId, phone: data.customerPhone },
  });
  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: data.customerName || existingCustomer.name,
          email: data.customerEmail || existingCustomer.email,
          address: data.customerAddress || existingCustomer.address,
        },
      })
    : await prisma.customer.create({
        data: {
          organizationId: data.organizationId,
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || null,
          address: data.customerAddress || null,
        },
      });

  const warrantyExpiry = new Date(data.purchaseDate);
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + 24);
  const warrantyCode = await generateWarrantyCode();

  const warranty = await prisma.warranty.create({
    data: {
      organizationId: data.organizationId,
      customerId: customer.id,
      productId: data.productId || null,
      productName: data.productName,
      color: data.color || null,
      size: data.size || null,
      purchaseChannel: data.purchaseChannel || null,
      purchaseDate: data.purchaseDate,
      warrantyExpiry,
      warrantyCode,
      status: "ACTIVE",
    },
  });
  await writeEvent({ organizationId: data.organizationId, type: "warranty.registered", entityType: "Warranty", entityId: warranty.id, occurredAt: warranty.createdAt });
  return warranty;
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
