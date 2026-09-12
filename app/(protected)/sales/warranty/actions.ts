"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createWarranty, updateWarranty, deleteWarranty } from "@/services/warranty/warranties";
import { WARRANTY_STATUSES } from "@/lib/warranty/types";

const warrantySchema = z.object({
  customerId: z.string().min(1, "Cần chọn khách hàng"),
  productName: z.string().trim().min(1, "Cần nhập tên sản phẩm"),
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  purchaseChannel: z.string().trim().optional(),
  purchaseDate: z.string().trim().optional(),
  warrantyExpiry: z.string().trim().optional(),
  warrantyCode: z.string().trim().min(1, "Cần nhập mã bảo hành"),
  status: z.enum(WARRANTY_STATUSES as [string, ...string[]]),
  notes: z.string().trim().optional(),
});

function toDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createWarrantyAction(formData: FormData) {
  const session = await assertPermission("warranty.create");
  const parsed = warrantySchema.parse({
    customerId: formData.get("customerId"),
    productName: formData.get("productName"),
    color: formData.get("color") || undefined,
    size: formData.get("size") || undefined,
    purchaseChannel: formData.get("purchaseChannel") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    warrantyExpiry: formData.get("warrantyExpiry") || undefined,
    warrantyCode: formData.get("warrantyCode"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  await createWarranty(session.user.organizationId, session.user.id, {
    ...parsed,
    status: parsed.status as (typeof WARRANTY_STATUSES)[number],
    purchaseDate: toDate(parsed.purchaseDate),
    warrantyExpiry: toDate(parsed.warrantyExpiry),
    color: parsed.color || null,
    size: parsed.size || null,
    purchaseChannel: parsed.purchaseChannel || null,
    notes: parsed.notes || null,
  });
  revalidatePath("/sales/warranty");
}

export async function updateWarrantyAction(warrantyId: string, formData: FormData) {
  const session = await assertPermission("warranty.update");
  const parsed = warrantySchema.parse({
    customerId: formData.get("customerId"),
    productName: formData.get("productName"),
    color: formData.get("color") || undefined,
    size: formData.get("size") || undefined,
    purchaseChannel: formData.get("purchaseChannel") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    warrantyExpiry: formData.get("warrantyExpiry") || undefined,
    warrantyCode: formData.get("warrantyCode"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  await updateWarranty(session.user.organizationId, session.user.id, warrantyId, {
    customerId: parsed.customerId,
    productName: parsed.productName,
    color: parsed.color || null,
    size: parsed.size || null,
    purchaseChannel: parsed.purchaseChannel || null,
    purchaseDate: toDate(parsed.purchaseDate),
    warrantyExpiry: toDate(parsed.warrantyExpiry),
    status: parsed.status as (typeof WARRANTY_STATUSES)[number],
    notes: parsed.notes || null,
  });
  revalidatePath("/sales/warranty");
}

export async function deleteWarrantyAction(warrantyId: string) {
  const session = await assertPermission("warranty.delete");
  await deleteWarranty(session.user.organizationId, session.user.id, warrantyId);
  revalidatePath("/sales/warranty");
}
