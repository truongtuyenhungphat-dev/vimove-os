"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createPublicOrderGlobal } from "@/services/sales/orders";

const orderSchema = z.object({
  customerName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ nhận hàng"),
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  note: z.string().trim().max(500).optional(),
});

export type SubmitOrderState = { ok: boolean; error?: string } | undefined;

export async function submitProductOrderAction(_prev: SubmitOrderState, formData: FormData): Promise<SubmitOrderState> {
  const parsed = orderSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    size: formData.get("size") || undefined,
    color: formData.get("color") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ" };
  }

  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) return { ok: false, error: "Hệ thống chưa sẵn sàng, vui lòng gọi hotline." };

  try {
    await createPublicOrderGlobal({ organizationId: organization.id, ...parsed.data });
    return { ok: true };
  } catch {
    return { ok: false, error: "Có lỗi xảy ra, vui lòng thử lại hoặc gọi hotline 0988 512 352." };
  }
}
