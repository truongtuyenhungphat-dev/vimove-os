import "server-only";
import { prisma } from "@/lib/db/client";
import { createApprovalRequest } from "@/services/process/approvals";
import { LEAVE_TYPE_LABELS } from "@/lib/attendance/types";
import type { LeaveType } from "@/lib/attendance/types";

const requestInclude = {
  user: { select: { id: true, name: true, avatarUrl: true } },
  approvalRequest: {
    include: {
      steps: { include: { approver: { select: { id: true, name: true } } }, orderBy: { position: "asc" as const } },
    },
  },
} as const;

/**
 * Đơn nghỉ phép — KHÔNG tự có luồng duyệt riêng, tạo 1 `ApprovalRequest` thật
 * (entityType "LEAVE") qua đúng Approval Engine đã có ở Process Hub (Phase 3): người
 * yêu cầu tự chọn người duyệt (giống luồng tạo Approval Request thủ công đã có),
 * duyệt/từ chối/escalate dùng nguyên `services/process/approvals.ts`, không có bản
 * sao thứ 2 của logic đó.
 */
export async function createLeaveRequest(
  organizationId: string,
  userId: string,
  data: { type: LeaveType; startDate: Date; endDate: Date; reason?: string | null; approverIds: string[] }
) {
  if (data.endDate < data.startDate) throw new Error("Ngày kết thúc phải sau ngày bắt đầu");

  const title = `Đơn ${LEAVE_TYPE_LABELS[data.type].toLowerCase()}: ${data.startDate.toLocaleDateString("vi-VN")} — ${data.endDate.toLocaleDateString("vi-VN")}`;
  // `entityId` của ApprovalRequest chỉ mang tính mô tả (không phải FK cứng, xem
  // prisma/schema.prisma) — quan hệ thật để tra ngược là LeaveRequest.approvalRequestId
  // (unique). Vì LeaveRequest cần approvalRequestId có sẵn để tạo, không có "id thật"
  // của LeaveRequest tại thời điểm tạo ApprovalRequest — dùng userId+thời điểm làm
  // entityId mô tả, không patch lại sau (tránh thêm 1 lượt ghi không cần thiết).
  const approvalRequest = await createApprovalRequest(organizationId, userId, {
    entityType: "LEAVE",
    entityId: `${userId}:${data.startDate.toISOString().slice(0, 10)}`,
    title,
    mode: "SEQUENTIAL",
    approverIds: data.approverIds,
  });

  return prisma.leaveRequest.create({
    data: {
      organizationId,
      userId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason || null,
      approvalRequestId: approvalRequest.id,
    },
  });
}

export async function listMyLeaveRequests(organizationId: string, userId: string) {
  return prisma.leaveRequest.findMany({
    where: { organizationId, userId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
}

export type LeaveVisibility = { scope: "ALL" | "DEPARTMENT" | "OWN"; userId: string; departmentId: string | null };

export async function listOrgLeaveRequests(organizationId: string, visibility: LeaveVisibility) {
  return prisma.leaveRequest.findMany({
    where: {
      organizationId,
      ...(visibility.scope === "OWN" ? { userId: visibility.userId } : {}),
      ...(visibility.scope === "DEPARTMENT"
        ? visibility.departmentId
          ? { user: { departmentId: visibility.departmentId } }
          : { id: { in: [] as string[] } }
        : {}),
    },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
}
