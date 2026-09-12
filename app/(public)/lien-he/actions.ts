"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createLeadFromContactFormGlobal } from "@/services/crm/leads";

const contactSchema = z.object({
  contactName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ"),
  email: z.string().trim().optional(),
  interest: z.string().trim().optional(),
  message: z.string().trim().min(1, "Vui lòng nhập nội dung cần tư vấn"),
});

export type ContactFormState = { ok: boolean; error?: string } | undefined;

export async function submitContactFormAction(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    interest: formData.get("interest") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ" };
  }

  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) return { ok: false, error: "Hệ thống chưa sẵn sàng, vui lòng gọi hotline." };

  await createLeadFromContactFormGlobal({ organizationId: organization.id, ...parsed.data });
  return { ok: true };
}
