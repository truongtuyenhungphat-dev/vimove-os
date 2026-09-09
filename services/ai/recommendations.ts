import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { updateCampaign } from "@/services/marketing/campaigns";

export async function listRecommendations(organizationId: string) {
  return prisma.aiRecommendation.findMany({
    where: { organizationId },
    include: { action: { include: { logs: { orderBy: { createdAt: "asc" } }, approvedBy: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Thực thi 1 action nhạy cảm THẬT — gọi thẳng service layer đã có (không phải giả
 * lập). Hỗ trợ PAUSE_CAMPAIGN (Phase 8) và ADJUST_BUDGET (Phase 9 — tối ưu ngân sách
 * budget/creative/audience: hiện chỉ budget là field thật có thể đổi mà không cần dữ
 * liệu Ads Phase 6; creative/audience cần AdCreative/AdAdSet thật từ 1 kết nối Ads đã
 * verify — chưa làm, xem docs/09-optimization.md). */
async function executeAction(
  organizationId: string,
  actorId: string,
  actionType: string,
  targetEntityType: string,
  targetEntityId: string,
  payload: unknown
): Promise<string> {
  if (actionType === "PAUSE_CAMPAIGN" && targetEntityType === "Campaign") {
    const campaign = await prisma.campaign.findFirst({ where: { id: targetEntityId, organizationId } });
    if (!campaign) throw new Error("Không tìm thấy chiến dịch để thực thi");
    await updateCampaign(organizationId, actorId, targetEntityId, {
      name: campaign.name,
      description: campaign.description,
      status: "PAUSED",
      projectId: campaign.projectId,
      budget: campaign.budget === null ? null : Number(campaign.budget),
      startAt: campaign.startAt,
      endAt: campaign.endAt,
    });
    return `Đã tạm dừng chiến dịch "${campaign.name}" thành công.`;
  }
  if (actionType === "ADJUST_BUDGET" && targetEntityType === "Campaign") {
    const campaign = await prisma.campaign.findFirst({ where: { id: targetEntityId, organizationId } });
    if (!campaign) throw new Error("Không tìm thấy chiến dịch để thực thi");
    const newBudget = (payload as { newBudget?: number } | null)?.newBudget;
    if (typeof newBudget !== "number" || newBudget < 0) throw new Error("Đề xuất thiếu giá trị ngân sách mới hợp lệ");
    await updateCampaign(organizationId, actorId, targetEntityId, {
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      projectId: campaign.projectId,
      budget: newBudget,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
    });
    return `Đã đổi ngân sách chiến dịch "${campaign.name}" từ ${Number(campaign.budget).toLocaleString("vi-VN")}đ xuống ${newBudget.toLocaleString("vi-VN")}đ.`;
  }
  throw new Error(`Loại hành động "${actionType}" chưa được hỗ trợ thực thi tự động.`);
}

/** Duyệt recommendation → tạo AiAction → thực thi thật → ghi kết quả. Toàn bộ nằm
 * trong 1 luồng để không có khoảng trống "đã duyệt nhưng chưa rõ có chạy hay không"
 * — đúng nghiệm thu "mọi AI action nhạy cảm chỉ thực thi sau khi user bấm duyệt, có
 * log đầy đủ". */
export async function approveRecommendation(organizationId: string, actorId: string, recommendationId: string) {
  const recommendation = await prisma.aiRecommendation.findFirst({ where: { id: recommendationId, organizationId } });
  if (!recommendation) throw new Error("Không tìm thấy đề xuất");
  if (recommendation.status !== "PENDING") throw new Error("Đề xuất này đã được xử lý");
  if (!recommendation.actionType || !recommendation.targetEntityType || !recommendation.targetEntityId) {
    throw new Error("Đề xuất này không có hành động thực thi (chỉ mang tính thông tin)");
  }

  const action = await prisma.aiAction.create({
    data: {
      organizationId,
      recommendationId,
      actionType: recommendation.actionType,
      targetEntityType: recommendation.targetEntityType,
      targetEntityId: recommendation.targetEntityId,
      approvedById: actorId,
      status: "PENDING",
    },
  });
  await prisma.aiActionLog.create({ data: { aiActionId: action.id, message: `Đã duyệt bởi người dùng — chuẩn bị thực thi ${recommendation.actionType}.` } });
  await prisma.aiRecommendation.update({ where: { id: recommendationId }, data: { status: "APPROVED" } });

  try {
    const resultMessage = await executeAction(
      organizationId,
      actorId,
      recommendation.actionType,
      recommendation.targetEntityType,
      recommendation.targetEntityId,
      recommendation.payload
    );
    await prisma.aiAction.update({ where: { id: action.id }, data: { status: "SUCCEEDED", executedAt: new Date(), resultMessage } });
    await prisma.aiActionLog.create({ data: { aiActionId: action.id, message: `Thành công: ${resultMessage}` } });
    await prisma.aiRecommendation.update({ where: { id: recommendationId }, data: { status: "EXECUTED" } });
    await writeAuditLog({ organizationId, actorId, action: "ai_action.execute_success", entityType: "AiAction", entityId: action.id, after: { resultMessage } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    await prisma.aiAction.update({ where: { id: action.id }, data: { status: "FAILED", executedAt: new Date(), resultMessage: message } });
    await prisma.aiActionLog.create({ data: { aiActionId: action.id, message: `Thất bại: ${message}` } });
    await writeAuditLog({ organizationId, actorId, action: "ai_action.execute_failed", entityType: "AiAction", entityId: action.id, after: { error: message } });
    throw err;
  }

  return action;
}

export async function rejectRecommendation(organizationId: string, actorId: string, recommendationId: string) {
  const recommendation = await prisma.aiRecommendation.findFirst({ where: { id: recommendationId, organizationId } });
  if (!recommendation) throw new Error("Không tìm thấy đề xuất");
  if (recommendation.status !== "PENDING") throw new Error("Đề xuất này đã được xử lý");
  await prisma.aiRecommendation.update({ where: { id: recommendationId }, data: { status: "REJECTED" } });
  await writeAuditLog({ organizationId, actorId, action: "ai_recommendation.reject", entityType: "AiRecommendation", entityId: recommendationId });
}
