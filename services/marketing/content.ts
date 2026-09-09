import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { ContentStatus, ContentType } from "@/lib/marketing/types";

const contentCardInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  campaign: { select: { id: true, name: true } },
} as const;

export async function getContentBoard(organizationId: string, filters: { campaignId?: string } = {}) {
  const contents = await prisma.content.findMany({
    where: { organizationId, ...(filters.campaignId ? { campaignId: filters.campaignId } : {}) },
    include: contentCardInclude,
    orderBy: { position: "asc" },
  });
  const board: Record<ContentStatus, typeof contents> = {
    IDEA: [],
    BRIEF: [],
    SCRIPT: [],
    PRODUCTION: [],
    REVIEW: [],
    APPROVED: [],
    SCHEDULED: [],
    PUBLISHED: [],
  };
  for (const c of contents) board[c.status as ContentStatus].push(c);
  return board;
}

/** Danh sách rút gọn dùng cho dropdown chọn "Nội dung liên kết" (vd ở Social Post). */
export async function listContentOptions(organizationId: string) {
  return prisma.content.findMany({
    where: { organizationId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getContent(organizationId: string, id: string) {
  return prisma.content.findFirst({
    where: { id, organizationId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
      assets: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      socialPosts: { select: { id: true, status: true, socialAccount: { select: { name: true, platform: true } } } },
    },
  });
}

export async function createContent(
  organizationId: string,
  actorId: string,
  data: { title: string; type: ContentType; campaignId?: string | null; assigneeId?: string | null; body?: string | null }
) {
  const last = await prisma.content.findFirst({ where: { organizationId, status: "IDEA" }, orderBy: { position: "desc" } });
  const content = await prisma.content.create({
    data: {
      organizationId,
      title: data.title,
      type: data.type,
      campaignId: data.campaignId || null,
      assigneeId: data.assigneeId || null,
      body: data.body || null,
      createdById: actorId,
      position: (last?.position ?? -1) + 1,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "content.create", entityType: "Content", entityId: content.id, after: { title: content.title } });
  return content;
}

export async function updateContent(
  organizationId: string,
  actorId: string,
  id: string,
  data: { title: string; type: ContentType; campaignId?: string | null; assigneeId?: string | null; body?: string | null }
) {
  const before = await prisma.content.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy nội dung");
  const updated = await prisma.content.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      campaignId: data.campaignId || null,
      assigneeId: data.assigneeId || null,
      body: data.body || null,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "content.update", entityType: "Content", entityId: id, before: { title: before.title }, after: { title: updated.title } });
  return updated;
}

export async function deleteContent(organizationId: string, actorId: string, id: string) {
  const before = await prisma.content.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy nội dung");
  await prisma.content.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "content.delete", entityType: "Content", entityId: id, before: { title: before.title } });
}

/** Kéo-thả trên Content Hub board — cùng pattern moveTaskStatus (Phase 2): reorder vị
 * trí trong cột đích + đổi status nếu cần. Không chặn transition ngược (vd Published
 * → Idea) vì content có thể cần làm lại — không giống dependency Work Hub. */
export async function moveContentStatus(organizationId: string, actorId: string, contentId: string, data: { status: ContentStatus; targetIndex: number }) {
  const content = await prisma.content.findFirst({ where: { id: contentId, organizationId } });
  if (!content) throw new Error("Không tìm thấy nội dung");
  const fromStatus = content.status as ContentStatus;
  const statusChanged = fromStatus !== data.status;

  await prisma.$transaction(async (tx) => {
    const targetColumn = await tx.content.findMany({
      where: { organizationId, status: data.status, id: { not: contentId } },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const ids = targetColumn.map((c) => c.id);
    const insertAt = Math.max(0, Math.min(data.targetIndex, ids.length));
    ids.splice(insertAt, 0, contentId);

    await Promise.all(
      ids.map((id, index) =>
        tx.content.update({
          where: { id },
          data: {
            position: index,
            ...(id === contentId && statusChanged
              ? { status: data.status, publishedAt: data.status === "PUBLISHED" ? new Date() : content.publishedAt }
              : {}),
          },
        })
      )
    );
  });

  if (statusChanged) {
    await writeAuditLog({
      organizationId,
      actorId,
      action: "content.status_change",
      entityType: "Content",
      entityId: contentId,
      before: { status: fromStatus },
      after: { status: data.status },
    });
  }
}

export async function addAsset(contentId: string, uploaderId: string, data: { label: string; url: string }) {
  return prisma.contentAsset.create({ data: { contentId, uploaderId, label: data.label, url: data.url } });
}

export async function removeAsset(id: string) {
  await prisma.contentAsset.delete({ where: { id } });
}
