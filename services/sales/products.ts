import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";

function serializeProduct<T extends { price: unknown; oldPrice?: unknown }>(product: T) {
  return { ...product, price: Number(product.price), oldPrice: product.oldPrice == null ? null : Number(product.oldPrice) };
}

export async function listProducts(organizationId: string, includeInactive = true) {
  const products = await prisma.product.findMany({
    where: { organizationId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: { createdAt: "desc" },
  });
  return products.map(serializeProduct);
}

/** Danh mục công khai (Phase 16) — không lọc theo organizationId, giống
 * getPublishedLandingPageBySlugGlobal/findWarrantyByCode: khách ẩn danh
 * không có session/organization context, và hệ thống hiện chỉ có 1 tổ
 * chức "vimove" nên không cần disambiguation. */
export async function listPublishedProductsGlobal(filters: { category?: string } = {}) {
  const products = await prisma.product.findMany({
    where: { isPublished: true, ...(filters.category ? { category: filters.category } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return products.map(serializeProduct);
}

export async function getPublishedProductBySlugGlobal(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, isPublished: true } });
  return product ? serializeProduct(product) : null;
}

export async function createProduct(
  organizationId: string,
  actorId: string,
  data: { name: string; sku?: string | null; price: number; unit?: string | null }
) {
  const product = await prisma.product.create({
    data: { organizationId, name: data.name, sku: data.sku || null, price: data.price, unit: data.unit || null },
  });
  await writeAuditLog({ organizationId, actorId, action: "product.create", entityType: "Product", entityId: product.id, after: { name: product.name } });
  return product;
}

export async function updateProduct(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; sku?: string | null; price: number; unit?: string | null; isActive: boolean }
) {
  const before = await prisma.product.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy sản phẩm");
  const updated = await prisma.product.update({
    where: { id },
    data: { name: data.name, sku: data.sku || null, price: data.price, unit: data.unit || null, isActive: data.isActive },
  });
  await writeAuditLog({ organizationId, actorId, action: "product.update", entityType: "Product", entityId: id, before: { name: before.name }, after: { name: updated.name } });
  return updated;
}

export async function deleteProduct(organizationId: string, actorId: string, id: string) {
  const before = await prisma.product.findFirst({ where: { id, organizationId }, include: { _count: { select: { orderItems: true } } } });
  if (!before) throw new Error("Không tìm thấy sản phẩm");
  if (before._count.orderItems > 0) throw new Error("Sản phẩm đã có trong đơn hàng, không thể xoá — có thể ẩn (bỏ Đang bán) thay vì xoá");
  await prisma.product.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "product.delete", entityType: "Product", entityId: id, before: { name: before.name } });
}
