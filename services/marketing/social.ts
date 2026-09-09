import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { SocialPlatform, SocialPostStatus } from "@/lib/marketing/types";

export async function listSocialAccounts(organizationId: string) {
  return prisma.socialAccount.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
}

export async function createSocialAccount(organizationId: string, actorId: string, data: { platform: SocialPlatform; name: string; handle?: string | null }) {
  const account = await prisma.socialAccount.create({ data: { organizationId, platform: data.platform, name: data.name, handle: data.handle || null } });
  await writeAuditLog({ organizationId, actorId, action: "social_account.create", entityType: "SocialAccount", entityId: account.id, after: { name: account.name } });
  return account;
}

export async function deleteSocialAccount(organizationId: string, actorId: string, id: string) {
  const before = await prisma.socialAccount.findFirst({ where: { id, organizationId }, include: { _count: { select: { posts: true } } } });
  if (!before) throw new Error("Không tìm thấy tài khoản");
  if (before._count.posts > 0) throw new Error("Tài khoản đang có bài đăng, không thể xoá");
  await prisma.socialAccount.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "social_account.delete", entityType: "SocialAccount", entityId: id, before: { name: before.name } });
}

export async function listSocialPosts(organizationId: string) {
  return prisma.socialPost.findMany({
    where: { organizationId },
    include: { socialAccount: { select: { id: true, name: true, platform: true } }, content: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSocialPost(
  organizationId: string,
  actorId: string,
  data: { socialAccountId: string; caption: string; contentId?: string | null; scheduledAt?: Date | null }
) {
  const post = await prisma.socialPost.create({
    data: {
      organizationId,
      socialAccountId: data.socialAccountId,
      caption: data.caption,
      contentId: data.contentId || null,
      scheduledAt: data.scheduledAt ?? null,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      createdById: actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "social_post.create", entityType: "SocialPost", entityId: post.id });
  return post;
}

/** Đăng bài là thao tác thủ công (user tự đăng trên nền tảng thật rồi đánh dấu ở đây)
 * — hệ thống chưa nối API mạng xã hội thật (§ ghi chú schema.prisma). */
export async function updateSocialPostStatus(organizationId: string, actorId: string, id: string, status: SocialPostStatus) {
  const before = await prisma.socialPost.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy bài đăng");
  const updated = await prisma.socialPost.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : before.publishedAt },
  });
  await writeAuditLog({ organizationId, actorId, action: "social_post.status_change", entityType: "SocialPost", entityId: id, before: { status: before.status }, after: { status } });
  return updated;
}

export async function deleteSocialPost(organizationId: string, actorId: string, id: string) {
  const before = await prisma.socialPost.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy bài đăng");
  await prisma.socialPost.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "social_post.delete", entityType: "SocialPost", entityId: id });
}
