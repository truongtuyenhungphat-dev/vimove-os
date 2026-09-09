"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createEmailCampaign, updateEmailCampaignStatus, deleteEmailCampaign } from "@/services/marketing/email-campaigns";

const emailSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên"),
  subject: z.string().trim().min(1, "Cần nhập tiêu đề"),
  campaignId: z.string().trim().optional(),
});

export async function createEmailCampaignAction(formData: FormData) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = emailSchema.parse({ name: formData.get("name"), subject: formData.get("subject"), campaignId: formData.get("campaignId") || undefined });
  await createEmailCampaign(session.user.organizationId, session.user.id, { name: parsed.name, subject: parsed.subject, campaignId: parsed.campaignId || null });
  revalidatePath("/marketing/email");
}

export async function updateEmailCampaignStatusAction(emailId: string, status: string) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = z.enum(["DRAFT", "SCHEDULED", "SENT"]).parse(status);
  await updateEmailCampaignStatus(session.user.organizationId, session.user.id, emailId, parsed);
  revalidatePath("/marketing/email");
}

export async function deleteEmailCampaignAction(emailId: string) {
  const session = await assertPermission("marketing_channels.manage");
  await deleteEmailCampaign(session.user.organizationId, session.user.id, emailId);
  revalidatePath("/marketing/email");
}
