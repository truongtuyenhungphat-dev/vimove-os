import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { STAGE_TASK_TYPE, type ContentPieceStage } from "@/lib/production/types";

// ---------------------------------------------------------------------------
// Kênh sản xuất
// ---------------------------------------------------------------------------

export async function listProductionChannels(organizationId: string) {
  return prisma.productionChannel.findMany({
    where: { organizationId, active: true },
    orderBy: { order: "asc" },
  });
}

export async function createProductionChannel(
  organizationId: string,
  actorId: string,
  data: { name: string; taskTypes: string[] }
) {
  const last = await prisma.productionChannel.findFirst({ where: { organizationId }, orderBy: { order: "desc" } });
  const channel = await prisma.productionChannel.create({
    data: { organizationId, name: data.name, taskTypes: data.taskTypes, order: (last?.order ?? -1) + 1 },
  });
  await writeAuditLog({ organizationId, actorId, action: "production_channel.create", entityType: "ProductionChannel", entityId: channel.id, after: { name: channel.name } });
  return channel;
}

export async function updateProductionChannel(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; taskTypes: string[] }
) {
  const before = await prisma.productionChannel.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy kênh");
  const updated = await prisma.productionChannel.update({ where: { id }, data: { name: data.name, taskTypes: data.taskTypes } });
  await writeAuditLog({ organizationId, actorId, action: "production_channel.update", entityType: "ProductionChannel", entityId: id, before: { name: before.name }, after: { name: updated.name } });
  return updated;
}

export async function deleteProductionChannel(organizationId: string, actorId: string, id: string) {
  const before = await prisma.productionChannel.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy kênh");
  await prisma.productionChannel.update({ where: { id }, data: { active: false } });
  await writeAuditLog({ organizationId, actorId, action: "production_channel.delete", entityType: "ProductionChannel", entityId: id, before: { name: before.name } });
}

// ---------------------------------------------------------------------------
// Roster đội sản xuất
// ---------------------------------------------------------------------------

export async function listProductionCreators(organizationId: string) {
  return prisma.productionCreator.findMany({
    where: { organizationId, active: true },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { order: "asc" },
  });
}

export async function addProductionCreator(organizationId: string, actorId: string, userId: string) {
  const existing = await prisma.productionCreator.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
  if (existing) {
    if (existing.active) return existing;
    return prisma.productionCreator.update({ where: { id: existing.id }, data: { active: true } });
  }
  const last = await prisma.productionCreator.findFirst({ where: { organizationId }, orderBy: { order: "desc" } });
  const creator = await prisma.productionCreator.create({ data: { organizationId, userId, order: (last?.order ?? -1) + 1 } });
  await writeAuditLog({ organizationId, actorId, action: "production_creator.add", entityType: "ProductionCreator", entityId: creator.id, after: { userId } });
  return creator;
}

export async function removeProductionCreator(organizationId: string, actorId: string, id: string) {
  const before = await prisma.productionCreator.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy thành viên");
  await prisma.productionCreator.update({ where: { id }, data: { active: false } });
  await writeAuditLog({ organizationId, actorId, action: "production_creator.remove", entityType: "ProductionCreator", entityId: id, before: { userId: before.userId } });
}

// ---------------------------------------------------------------------------
// Bảng đếm tiến độ hằng ngày
// ---------------------------------------------------------------------------

/** `start`/`end` là chuỗi "YYYY-MM-DD" (khớp cột `date` dạng String — so sánh
 * lexicographic đúng thứ tự thời gian vì cùng độ dài/định dạng). */
export async function listProductionEntries(organizationId: string, start: string, end: string) {
  return prisma.productionEntry.findMany({
    where: { organizationId, date: { gte: start, lte: end } },
  });
}

/** Ghi đè tuyệt đối 1 ô (nhập tay trên bảng đếm) — khác `bumpEntryCount` (cộng dồn
 * tự động khi kéo thẻ kanban) vì đây là admin sửa trực tiếp số liệu, không cộng thêm. */
export async function setProductionEntryCount(
  organizationId: string,
  data: { date: string; userId: string; channelId: string; taskType: string; value: number }
) {
  const existing = await prisma.productionEntry.findUnique({
    where: { organizationId_date_userId_channelId: { organizationId, date: data.date, userId: data.userId, channelId: data.channelId } },
  });
  const counts = { ...((existing?.counts as Record<string, number>) ?? {}) };
  if (data.value > 0) counts[data.taskType] = data.value;
  else delete counts[data.taskType];

  await prisma.productionEntry.upsert({
    where: { organizationId_date_userId_channelId: { organizationId, date: data.date, userId: data.userId, channelId: data.channelId } },
    create: { organizationId, date: data.date, userId: data.userId, channelId: data.channelId, counts },
    update: { counts },
  });
}

/** Cộng dồn +1 tự động khi 1 thẻ kanban chuyển vào giai đoạn có task type tương ứng
 * — xem `moveContentPiece`. Không ghi đè (khác `setProductionEntryCount`). */
async function bumpEntryCount(organizationId: string, date: string, userId: string, channelId: string, taskType: string) {
  const existing = await prisma.productionEntry.findUnique({
    where: { organizationId_date_userId_channelId: { organizationId, date, userId, channelId } },
  });
  const counts = { ...((existing?.counts as Record<string, number>) ?? {}) };
  counts[taskType] = (counts[taskType] ?? 0) + 1;

  await prisma.productionEntry.upsert({
    where: { organizationId_date_userId_channelId: { organizationId, date, userId, channelId } },
    create: { organizationId, date, userId, channelId, counts },
    update: { counts },
  });
}

// ---------------------------------------------------------------------------
// Kanban thẻ sản xuất
// ---------------------------------------------------------------------------

const pieceInclude = {
  channel: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export async function getProductionBoard(organizationId: string) {
  const pieces = await prisma.contentPiece.findMany({
    where: { organizationId },
    include: pieceInclude,
    orderBy: { position: "asc" },
  });
  const board: Record<ContentPieceStage, typeof pieces> = { IDEA: [], SCRIPT: [], SHOOT: [], EDIT: [], REVIEW: [], POSTED: [] };
  for (const p of pieces) board[p.stage as ContentPieceStage].push(p);
  return board;
}

export async function createContentPiece(
  organizationId: string,
  actorId: string,
  data: { title: string; channelId?: string | null; assigneeId?: string | null }
) {
  const last = await prisma.contentPiece.findFirst({ where: { organizationId, stage: "IDEA" }, orderBy: { position: "desc" } });
  const piece = await prisma.contentPiece.create({
    data: {
      organizationId,
      title: data.title,
      channelId: data.channelId || null,
      assigneeId: data.assigneeId || null,
      createdById: actorId,
      position: (last?.position ?? -1) + 1,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "content_piece.create", entityType: "ContentPiece", entityId: piece.id, after: { title: piece.title } });
  return piece;
}

export async function deleteContentPiece(organizationId: string, actorId: string, id: string) {
  const before = await prisma.contentPiece.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy thẻ");
  await prisma.contentPiece.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "content_piece.delete", entityType: "ContentPiece", entityId: id, before: { title: before.title } });
}

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Kéo-thả trên kanban sản xuất — cùng pattern moveContentStatus (Content Hub):
 * reorder vị trí trong cột đích + đổi stage nếu cần. Khi stage mới rơi vào
 * STAGE_TASK_TYPE (SCRIPT/SHOOT/EDIT/POSTED) VÀ thẻ có sẵn người phụ trách + kênh,
 * tự +1 vào bảng đếm tiến độ hôm nay cho đúng người/kênh/task type — đây là chỗ
 * 2 module (kanban & bảng đếm) tự đồng bộ, người dùng không cần nhập tay 2 lần. */
export async function moveContentPiece(
  organizationId: string,
  actorId: string,
  pieceId: string,
  data: { stage: ContentPieceStage; targetIndex: number }
) {
  const piece = await prisma.contentPiece.findFirst({ where: { id: pieceId, organizationId } });
  if (!piece) throw new Error("Không tìm thấy thẻ");
  const fromStage = piece.stage as ContentPieceStage;
  const stageChanged = fromStage !== data.stage;

  await prisma.$transaction(async (tx) => {
    const targetColumn = await tx.contentPiece.findMany({
      where: { organizationId, stage: data.stage, id: { not: pieceId } },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const ids = targetColumn.map((c) => c.id);
    const insertAt = Math.max(0, Math.min(data.targetIndex, ids.length));
    ids.splice(insertAt, 0, pieceId);

    await Promise.all(
      ids.map((id, index) =>
        tx.contentPiece.update({
          where: { id },
          data: { position: index, ...(id === pieceId && stageChanged ? { stage: data.stage } : {}) },
        })
      )
    );
  });

  if (stageChanged) {
    await writeAuditLog({
      organizationId,
      actorId,
      action: "content_piece.stage_change",
      entityType: "ContentPiece",
      entityId: pieceId,
      before: { stage: fromStage },
      after: { stage: data.stage },
    });

    const taskType = STAGE_TASK_TYPE[data.stage];
    if (taskType && piece.assigneeId && piece.channelId) {
      await bumpEntryCount(organizationId, todayDateKey(), piece.assigneeId, piece.channelId, taskType);
    }
  }
}
