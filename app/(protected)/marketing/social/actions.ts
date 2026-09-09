"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createSocialAccount, deleteSocialAccount, createSocialPost, updateSocialPostStatus, deleteSocialPost } from "@/services/marketing/social";

const accountSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE", "ZALO", "OTHER"]),
  name: z.string().trim().min(1, "Cần nhập tên"),
  handle: z.string().trim().optional(),
});

export async function createSocialAccountAction(formData: FormData) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = accountSchema.parse({ platform: formData.get("platform"), name: formData.get("name"), handle: formData.get("handle") || undefined });
  await createSocialAccount(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/marketing/social");
}

export async function deleteSocialAccountAction(accountId: string) {
  const session = await assertPermission("marketing_channels.manage");
  await deleteSocialAccount(session.user.organizationId, session.user.id, accountId);
  revalidatePath("/marketing/social");
}

const postSchema = z.object({
  socialAccountId: z.string().min(1, "Cần chọn tài khoản"),
  contentId: z.string().trim().optional(),
  caption: z.string().trim().min(1, "Cần nhập nội dung"),
  scheduledAt: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export async function createSocialPostAction(formData: FormData) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = postSchema.parse({
    socialAccountId: formData.get("socialAccountId"),
    contentId: formData.get("contentId") || undefined,
    caption: formData.get("caption"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  await createSocialPost(session.user.organizationId, session.user.id, {
    socialAccountId: parsed.socialAccountId,
    caption: parsed.caption,
    contentId: parsed.contentId || null,
    scheduledAt: parsed.scheduledAt ?? null,
  });
  revalidatePath("/marketing/social");
}

export async function updateSocialPostStatusAction(postId: string, status: string) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).parse(status);
  await updateSocialPostStatus(session.user.organizationId, session.user.id, postId, parsed);
  revalidatePath("/marketing/social");
}

export async function deleteSocialPostAction(postId: string) {
  const session = await assertPermission("marketing_channels.manage");
  await deleteSocialPost(session.user.organizationId, session.user.id, postId);
  revalidatePath("/marketing/social");
}
