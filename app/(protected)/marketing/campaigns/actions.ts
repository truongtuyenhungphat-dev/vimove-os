"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createCampaign, updateCampaign, deleteCampaign, addChannel, removeChannel } from "@/services/marketing/campaigns";

const dateOrUndefined = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined));

const campaignBaseSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên chiến dịch"),
  description: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  budget: z.coerce.number().min(0).optional(),
  startAt: dateOrUndefined,
  endAt: dateOrUndefined,
});

export async function createCampaignAction(formData: FormData) {
  const session = await assertPermission("campaigns.create");
  const parsed = campaignBaseSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId") || undefined,
    budget: formData.get("budget") || undefined,
    startAt: formData.get("startAt") || undefined,
    endAt: formData.get("endAt") || undefined,
  });
  await createCampaign(session.user.organizationId, session.user.id, {
    name: parsed.name,
    description: parsed.description || null,
    projectId: parsed.projectId || null,
    budget: parsed.budget ?? null,
    startAt: parsed.startAt ?? null,
    endAt: parsed.endAt ?? null,
  });
  revalidatePath("/marketing/campaigns");
}

export async function updateCampaignAction(campaignId: string, formData: FormData) {
  const session = await assertPermission("campaigns.update");
  const parsed = campaignBaseSchema.extend({ status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]) }).parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId") || undefined,
    budget: formData.get("budget") || undefined,
    startAt: formData.get("startAt") || undefined,
    endAt: formData.get("endAt") || undefined,
    status: formData.get("status"),
  });
  await updateCampaign(session.user.organizationId, session.user.id, campaignId, {
    name: parsed.name,
    description: parsed.description || null,
    status: parsed.status,
    projectId: parsed.projectId || null,
    budget: parsed.budget ?? null,
    startAt: parsed.startAt ?? null,
    endAt: parsed.endAt ?? null,
  });
  revalidatePath("/marketing/campaigns");
  revalidatePath(`/marketing/campaigns/${campaignId}`);
}

export async function deleteCampaignAction(campaignId: string) {
  const session = await assertPermission("campaigns.delete");
  await deleteCampaign(session.user.organizationId, session.user.id, campaignId);
  revalidatePath("/marketing/campaigns");
}

const channelSchema = z.object({
  type: z.enum(["FACEBOOK", "GOOGLE", "TIKTOK", "ZALO", "EMAIL", "ORGANIC", "REFERRAL", "OTHER"]),
  plannedBudget: z.coerce.number().min(0).optional(),
});

export async function addChannelAction(campaignId: string, formData: FormData) {
  const session = await assertPermission("campaigns.update");
  const parsed = channelSchema.parse({ type: formData.get("type"), plannedBudget: formData.get("plannedBudget") || undefined });
  await addChannel(session.user.organizationId, campaignId, { type: parsed.type, plannedBudget: parsed.plannedBudget ?? null });
  revalidatePath(`/marketing/campaigns/${campaignId}`);
}

export async function removeChannelAction(campaignId: string, channelId: string) {
  const session = await assertPermission("campaigns.update");
  await removeChannel(session.user.organizationId, channelId);
  revalidatePath(`/marketing/campaigns/${campaignId}`);
}
