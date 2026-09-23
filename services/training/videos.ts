import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";

export type TrainingVideoData = {
  order?: number;
  category: string;
  title: string;
  publishedDate?: Date | null;
  youtubeUrl: string;
  mbsUrl?: string | null;
};

export async function listTrainingVideos(organizationId: string) {
  return prisma.trainingVideo.findMany({
    where: { organizationId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

/** Danh mục đang có, dùng gợi ý cho ô nhập danh mục (datalist) — không enum vì
 * danh sách sẽ mở rộng dần khi nhân sự đào tạo thêm video mới. */
export async function listTrainingCategories(organizationId: string) {
  const rows = await prisma.trainingVideo.findMany({
    where: { organizationId },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export async function createTrainingVideo(organizationId: string, actorId: string, data: TrainingVideoData) {
  let order = data.order;
  if (order == null) {
    const last = await prisma.trainingVideo.findFirst({ where: { organizationId }, orderBy: { order: "desc" } });
    order = (last?.order ?? 0) + 1;
  }
  const video = await prisma.trainingVideo.create({
    data: {
      organizationId,
      order,
      category: data.category,
      title: data.title,
      publishedDate: data.publishedDate ?? null,
      youtubeUrl: data.youtubeUrl,
      mbsUrl: data.mbsUrl || null,
      createdById: actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "training_video.create", entityType: "TrainingVideo", entityId: video.id, after: { title: video.title } });
  return video;
}

export async function updateTrainingVideo(organizationId: string, actorId: string, id: string, data: TrainingVideoData) {
  const before = await prisma.trainingVideo.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy video");
  const updated = await prisma.trainingVideo.update({
    where: { id },
    data: {
      order: data.order ?? before.order,
      category: data.category,
      title: data.title,
      publishedDate: data.publishedDate ?? null,
      youtubeUrl: data.youtubeUrl,
      mbsUrl: data.mbsUrl || null,
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "training_video.update",
    entityType: "TrainingVideo",
    entityId: id,
    before: { title: before.title },
    after: { title: updated.title },
  });
  return updated;
}

export async function deleteTrainingVideo(organizationId: string, actorId: string, id: string) {
  const before = await prisma.trainingVideo.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy video");
  await prisma.trainingVideo.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "training_video.delete", entityType: "TrainingVideo", entityId: id, before: { title: before.title } });
}
