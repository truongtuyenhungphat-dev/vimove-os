"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createWarrantyFromPublicFormGlobal, findWarrantyByCode, findWarrantiesByPhoneGlobal } from "@/services/warranty/warranties";
import type { WarrantyStatus } from "@/lib/warranty/types";

const registerSchema = z.object({
  customerName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  customerPhone: z.string().trim().min(8, "Số điện thoại không hợp lệ"),
  customerEmail: z.string().trim().optional(),
  customerAddress: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  productName: z.string().trim().min(1, "Vui lòng chọn sản phẩm"),
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  purchaseChannel: z.string().trim().optional(),
  purchaseDate: z.string().trim().min(1, "Vui lòng chọn ngày mua"),
  agree: z.literal("on", { message: "Vui lòng đồng ý với chính sách bảo hành" }),
});

export type RegisterWarrantyState = { ok: true; warrantyCode: string } | { ok: false; error: string } | undefined;

export async function registerWarrantyAction(_prev: RegisterWarrantyState, formData: FormData): Promise<RegisterWarrantyState> {
  const parsed = registerSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") || undefined,
    customerAddress: formData.get("customerAddress") || undefined,
    productId: formData.get("productId") || undefined,
    productName: formData.get("productName"),
    color: formData.get("color") || undefined,
    size: formData.get("size") || undefined,
    purchaseChannel: formData.get("purchaseChannel") || undefined,
    purchaseDate: formData.get("purchaseDate"),
    agree: formData.get("agree"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ" };
  }

  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) return { ok: false, error: "Hệ thống chưa sẵn sàng, vui lòng gọi hotline 0988 512 352." };

  const purchaseDate = new Date(parsed.data.purchaseDate);
  if (Number.isNaN(purchaseDate.getTime())) return { ok: false, error: "Ngày mua không hợp lệ" };

  try {
    const warranty = await createWarrantyFromPublicFormGlobal({
      organizationId: organization.id,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerEmail: parsed.data.customerEmail,
      customerAddress: parsed.data.customerAddress,
      productId: parsed.data.productId,
      productName: parsed.data.productName,
      color: parsed.data.color,
      size: parsed.data.size,
      purchaseChannel: parsed.data.purchaseChannel,
      purchaseDate,
    });
    return { ok: true, warrantyCode: warranty.warrantyCode };
  } catch {
    return { ok: false, error: "Đăng ký bảo hành thất bại do lỗi hệ thống. Vui lòng thử lại sau ít phút, hoặc liên hệ hotline 0988 512 352." };
  }
}

export type WarrantyLookupResult = {
  warrantyCode: string;
  productName: string;
  color: string | null;
  size: string | null;
  purchaseChannel: string | null;
  purchaseDate: string | null; // ISO — chuyển từ Date sang string trước khi trả về Client Component
  warrantyExpiry: string | null;
  status: WarrantyStatus;
  notes: string | null;
  customerName: string;
  customerPhone: string;
};

function toLookupResult(w: NonNullable<Awaited<ReturnType<typeof findWarrantyByCode>>>): WarrantyLookupResult {
  return {
    warrantyCode: w.warrantyCode,
    productName: w.productName,
    color: w.color,
    size: w.size,
    purchaseChannel: w.purchaseChannel,
    purchaseDate: w.purchaseDate ? w.purchaseDate.toISOString() : null,
    warrantyExpiry: w.warrantyExpiry ? w.warrantyExpiry.toISOString() : null,
    status: w.status,
    notes: w.notes,
    customerName: w.customer.name,
    customerPhone: w.customer.phone ?? "",
  };
}

export async function lookupWarrantyAction(rawInput: string): Promise<{ results: WarrantyLookupResult[] }> {
  const raw = rawInput.trim();
  if (!raw) return { results: [] };

  const digitsOnly = raw.replace(/\s/g, "");
  const isPhone = /^[0-9]{8,11}$/.test(digitsOnly);

  if (isPhone) {
    const warranties = await findWarrantiesByPhoneGlobal(digitsOnly);
    return { results: warranties.map(toLookupResult) };
  }

  const warranty = await findWarrantyByCode(raw.toUpperCase());
  return { results: warranty ? [toLookupResult(warranty)] : [] };
}
