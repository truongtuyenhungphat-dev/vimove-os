"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createContent, updateContent, deleteContent, moveContentStatus, addAsset, removeAsset } from "@/services/marketing/content";

const CONTENT_TYPE_ENUM = z.enum(["ARTICLE", "VIDEO", "IMAGE", "SOCIAL_POST", "EMAIL", "OTHER"]);
const CONTENT_STATUS_ENUM = z.enum(["IDEA", "BRIEF", "SCRIPT", "PRODUCTION", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"]);

const contentSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tiêu đề"),
  type: CONTENT_TYPE_ENUM,
  campaignId: z.string().trim().optional(),
  assigneeId: z.string().trim().optional(),
  body: z.string().trim().optional(),
});

export async function createContentAction(formData: FormData) {
  const session = await assertPermission("content.create");
  const parsed = contentSchema.parse({
    title: formData.get("title"),
    type: formData.get("type"),
    campaignId: formData.get("campaignId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    body: formData.get("body") || undefined,
  });
  await createContent(session.user.organizationId, session.user.id, {
    title: parsed.title,
    type: parsed.type,
    campaignId: parsed.campaignId || null,
    assigneeId: parsed.assigneeId || null,
    body: parsed.body || null,
  });
  revalidatePath("/marketing/content");
}

export async function updateContentAction(contentId: string, formData: FormData) {
  const session = await assertPermission("content.update");
  const parsed = contentSchema.parse({
    title: formData.get("title"),
    type: formData.get("type"),
    campaignId: formData.get("campaignId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    body: formData.get("body") || undefined,
  });
  await updateContent(session.user.organizationId, session.user.id, contentId, {
    title: parsed.title,
    type: parsed.type,
    campaignId: parsed.campaignId || null,
    assigneeId: parsed.assigneeId || null,
    body: parsed.body || null,
  });
  revalidatePath("/marketing/content");
  revalidatePath(`/marketing/content/${contentId}`);
}

export async function deleteContentAction(contentId: string) {
  const session = await assertPermission("content.delete");
  await deleteContent(session.user.organizationId, session.user.id, contentId);
  revalidatePath("/marketing/content");
}

export async function moveContentStatusAction(contentId: string, status: string, targetIndex: number) {
  const session = await assertPermission("content.update");
  const parsedStatus = CONTENT_STATUS_ENUM.parse(status);
  await moveContentStatus(session.user.organizationId, session.user.id, contentId, { status: parsedStatus, targetIndex });
  revalidatePath("/marketing/content");
  revalidatePath(`/marketing/content/${contentId}`);
}

const assetSchema = z.object({ label: z.string().trim().min(1, "Cần nhập tên"), url: z.string().trim().url("URL không hợp lệ") });

export async function addAssetAction(contentId: string, data: { label: string; url: string }) {
  const session = await assertPermission("content.update");
  const parsed = assetSchema.parse(data);
  await addAsset(contentId, session.user.id, parsed);
  revalidatePath(`/marketing/content/${contentId}`);
}

export async function removeAssetAction(contentId: string, assetId: string) {
  await assertPermission("content.update");
  await removeAsset(assetId);
  revalidatePath(`/marketing/content/${contentId}`);
}
