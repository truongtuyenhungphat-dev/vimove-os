import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { createNotification } from "@/services/core/notifications";
import type { ApprovalEntityType, ApprovalMode } from "@/lib/process/types";

const requestInclude = {
  requestedBy: { select: { id: true, name: true } },
  steps: {
    include: { approver: { select: { id: true, name: true } }, escalatedTo: { select: { id: true, name: true } } },
    orderBy: { position: "asc" as const },
  },
} as const;

export async function createApprovalRequest(
  organizationId: string,
  requestedById: string,
  data: {
    entityType: ApprovalEntityType;
    entityId: string;
    title: string;
    mode: ApprovalMode;
    slaHours?: number | null;
    approverIds: string[];
  }
) {
  if (data.approverIds.length === 0) throw new Error("Cần chọn ít nhất 1 người duyệt");

  const dueAt = data.slaHours ? new Date(Date.now() + data.slaHours * 60 * 60 * 1000) : null;

  const request = await prisma.approvalRequest.create({
    data: {
      organizationId,
      entityType: data.entityType,
      entityId: data.entityId,
      title: data.title,
      requestedById,
      mode: data.mode,
      slaHours: data.slaHours ?? null,
      dueAt,
      steps: { create: data.approverIds.map((approverId, position) => ({ approverId, position })) },
    },
    include: requestInclude,
  });

  // Thông báo cho người duyệt đầu tiên (sequential) hoặc tất cả (parallel).
  const notifyIds = data.mode === "PARALLEL" ? data.approverIds : [data.approverIds[0]];
  await Promise.all(
    notifyIds.map((userId) =>
      createNotification({
        userId,
        type: "APPROVAL",
        title: `Yêu cầu duyệt: ${data.title}`,
        link: "/work/approvals",
      })
    )
  );

  await writeAuditLog({
    organizationId,
    actorId: requestedById,
    action: "approval.request.create",
    entityType: "ApprovalRequest",
    entityId: request.id,
    after: { title: data.title, entityType: data.entityType, entityId: data.entityId },
  });

  return request;
}

/** 1 step "đến lượt" khi: request đang PENDING, step đang PENDING, và (parallel) hoặc
 * (sequential + mọi step trước đã APPROVED). */
function isStepActionable(request: { mode: ApprovalMode; status: string }, steps: { position: number; status: string }[], step: { position: number; status: string }) {
  if (request.status !== "PENDING" || step.status !== "PENDING") return false;
  if (request.mode === "PARALLEL") return true;
  return steps.filter((s) => s.position < step.position).every((s) => s.status === "APPROVED");
}

export async function listMyPendingApprovals(organizationId: string, userId: string) {
  const requests = await prisma.approvalRequest.findMany({
    where: { organizationId, status: "PENDING", steps: { some: { approverId: userId, status: "PENDING" } } },
    include: requestInclude,
    orderBy: { createdAt: "asc" },
  });

  return requests
    .map((r) => {
      const myStep = r.steps.find((s) => s.approverId === userId && s.status === "PENDING");
      if (!myStep) return null;
      const actionable = isStepActionable(r, r.steps, myStep);
      return { request: r, step: myStep, actionable };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export async function listAllApprovals(organizationId: string, filters: { status?: string } = {}) {
  return prisma.approvalRequest.findMany({
    where: { organizationId, ...(filters.status ? { status: filters.status as never } : {}) },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyRequestedApprovals(organizationId: string, userId: string) {
  return prisma.approvalRequest.findMany({
    where: { organizationId, requestedById: userId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function decideStep(
  organizationId: string,
  actorId: string,
  stepId: string,
  decision: "APPROVED" | "REJECTED",
  comment?: string | null
) {
  const step = await prisma.approvalStep.findFirst({
    where: { id: stepId },
    include: { approvalRequest: { include: { steps: { orderBy: { position: "asc" } } } } },
  });
  if (!step || step.approvalRequest.organizationId !== organizationId) throw new Error("Không tìm thấy yêu cầu duyệt");
  if (step.approverId !== actorId) throw new Error("Bạn không phải người duyệt của bước này");
  if (!isStepActionable(step.approvalRequest, step.approvalRequest.steps, step)) {
    throw new Error("Chưa đến lượt duyệt bước này (hoặc yêu cầu đã xử lý xong)");
  }

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: { status: decision, decidedAt: new Date(), comment: comment || null },
  });

  let finalStatus: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
  if (decision === "REJECTED") {
    finalStatus = "REJECTED";
  } else {
    const otherSteps = step.approvalRequest.steps.filter((s) => s.id !== stepId);
    const allApproved =
      step.approvalRequest.mode === "PARALLEL"
        ? otherSteps.every((s) => s.status === "APPROVED")
        : otherSteps.filter((s) => s.position > step.position).length === 0;
    if (allApproved) finalStatus = "APPROVED";

    // Sequential: báo cho người duyệt kế tiếp.
    if (step.approvalRequest.mode === "SEQUENTIAL" && finalStatus === "PENDING") {
      const next = otherSteps.find((s) => s.position === step.position + 1);
      if (next) {
        await createNotification({
          userId: next.approverId,
          type: "APPROVAL",
          title: `Yêu cầu duyệt: ${step.approvalRequest.title}`,
          link: "/work/approvals",
        });
      }
    }
  }

  if (finalStatus !== "PENDING") {
    await prisma.approvalRequest.update({ where: { id: step.approvalRequestId }, data: { status: finalStatus } });
    await createNotification({
      userId: step.approvalRequest.requestedById,
      type: "APPROVAL",
      title: `Yêu cầu "${step.approvalRequest.title}" đã ${finalStatus === "APPROVED" ? "được duyệt" : "bị từ chối"}`,
      link: "/work/approvals",
    });
  }

  await writeAuditLog({
    organizationId,
    actorId,
    action: decision === "APPROVED" ? "approval.step.approve" : "approval.step.reject",
    entityType: "ApprovalRequest",
    entityId: step.approvalRequestId,
    after: { stepId, decision, comment },
  });

  return { finalStatus };
}

export async function cancelApprovalRequest(organizationId: string, actorId: string, id: string) {
  const request = await prisma.approvalRequest.findFirst({ where: { id, organizationId } });
  if (!request) throw new Error("Không tìm thấy yêu cầu duyệt");

  await prisma.$transaction([
    prisma.approvalRequest.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.approvalStep.updateMany({ where: { approvalRequestId: id, status: "PENDING" }, data: { status: "SKIPPED" } }),
  ]);

  await writeAuditLog({ organizationId, actorId, action: "approval.request.cancel", entityType: "ApprovalRequest", entityId: id });
}

/**
 * Escalation cơ bản (chạy on-read mỗi khi mở Approval Hub, không cần cron): step nào
 * đang "đến lượt", quá hạn SLA và chưa escalate thì đánh dấu escalatedAt + báo cho cả
 * requester lẫn approver gốc. MVP: KHÔNG tự chuyển người duyệt sang "quản lý trực tiếp"
 * vì data model chưa có khái niệm đó — chỉ cảnh báo, việc chuyển tay do requester quyết.
 */
export async function escalateOverdueSteps(organizationId: string) {
  const now = new Date();
  const overdue = await prisma.approvalRequest.findMany({
    where: { organizationId, status: "PENDING", dueAt: { lt: now } },
    include: { steps: { orderBy: { position: "asc" } } },
  });

  for (const request of overdue) {
    const activeStep = request.steps.find((s) => isStepActionable(request, request.steps, s) && !s.escalatedAt);
    if (!activeStep) continue;

    await prisma.approvalStep.update({
      where: { id: activeStep.id },
      data: { escalatedAt: now, escalatedToId: request.requestedById },
    });
    await Promise.all([
      createNotification({
        userId: activeStep.approverId,
        type: "ALERT",
        title: `Yêu cầu duyệt "${request.title}" đã quá hạn SLA`,
        link: "/work/approvals",
      }),
      createNotification({
        userId: request.requestedById,
        type: "ALERT",
        title: `Yêu cầu "${request.title}" đang quá hạn — người duyệt chưa xử lý`,
        link: "/work/approvals",
      }),
    ]);
  }
}
