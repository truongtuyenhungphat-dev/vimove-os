import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { EMPTY_WORKFLOW_DEFINITION, type WorkflowDefinition } from "@/lib/process/types";

export async function listWorkflows(organizationId: string) {
  return prisma.workflow.findMany({
    where: { organizationId },
    include: {
      createdBy: { select: { id: true, name: true } },
      currentVersion: { select: { id: true, version: true, publishedAt: true } },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkflow(organizationId: string, id: string) {
  return prisma.workflow.findFirst({
    where: { id, organizationId },
    include: {
      createdBy: { select: { id: true, name: true } },
      currentVersion: true,
      versions: { orderBy: { version: "desc" }, select: { id: true, version: true, publishedAt: true, createdAt: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, status: true, triggerType: true, startedAt: true, finishedAt: true, createdAt: true } },
    },
  });
}

export async function assertWorkflowInOrganization(organizationId: string, id: string) {
  const workflow = await prisma.workflow.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!workflow) throw new Error("Không tìm thấy workflow");
  return workflow;
}

export async function createWorkflow(organizationId: string, actorId: string, data: { name: string; description?: string | null }) {
  const workflow = await prisma.$transaction(async (tx) => {
    const created = await tx.workflow.create({
      data: { organizationId, name: data.name, description: data.description || null, createdById: actorId },
    });
    const version = await tx.workflowVersion.create({
      data: { workflowId: created.id, version: 1, definition: EMPTY_WORKFLOW_DEFINITION, createdById: actorId },
    });
    return tx.workflow.update({ where: { id: created.id }, data: { currentVersionId: version.id }, include: { currentVersion: true } });
  });
  await writeAuditLog({ organizationId, actorId, action: "workflow.create", entityType: "Workflow", entityId: workflow.id, after: { name: data.name } });
  return workflow;
}

export async function renameWorkflow(organizationId: string, actorId: string, id: string, data: { name: string; description?: string | null }) {
  const before = await prisma.workflow.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy workflow");
  const updated = await prisma.workflow.update({ where: { id }, data: { name: data.name, description: data.description || null } });
  await writeAuditLog({ organizationId, actorId, action: "workflow.update", entityType: "Workflow", entityId: id, before: { name: before.name }, after: { name: data.name } });
  return updated;
}

export async function deleteWorkflow(organizationId: string, actorId: string, id: string) {
  const before = await prisma.workflow.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy workflow");
  // currentVersionId có FK unique trỏ vào WorkflowVersion — gỡ trước để tránh vướng khi cascade xoá versions.
  await prisma.$transaction([
    prisma.workflow.update({ where: { id }, data: { currentVersionId: null } }),
    prisma.workflow.delete({ where: { id } }),
  ]);
  await writeAuditLog({ organizationId, actorId, action: "workflow.delete", entityType: "Workflow", entityId: id, before: { name: before.name } });
}

/**
 * Lưu bản nháp: nếu currentVersion CHƯA publish thì sửa tại chỗ; nếu ĐÃ publish (bất
 * biến — đúng quy tắc "không sửa version đang chạy") thì tạo version mới ở trạng thái
 * nháp và trỏ currentVersionId sang version mới.
 */
export async function saveDraft(organizationId: string, actorId: string, workflowId: string, definition: WorkflowDefinition) {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, organizationId }, include: { currentVersion: true } });
  if (!workflow) throw new Error("Không tìm thấy workflow");

  if (workflow.currentVersion && !workflow.currentVersion.publishedAt) {
    return prisma.workflowVersion.update({ where: { id: workflow.currentVersion.id }, data: { definition } });
  }

  const last = await prisma.workflowVersion.findFirst({ where: { workflowId }, orderBy: { version: "desc" } });
  const version = await prisma.workflowVersion.create({
    data: { workflowId, version: (last?.version ?? 0) + 1, definition, createdById: actorId },
  });
  await prisma.workflow.update({ where: { id: workflowId }, data: { currentVersionId: version.id } });
  return version;
}

export async function publishCurrentVersion(organizationId: string, actorId: string, workflowId: string) {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, organizationId }, include: { currentVersion: true } });
  if (!workflow || !workflow.currentVersion) throw new Error("Không tìm thấy workflow");
  if (workflow.currentVersion.publishedAt) throw new Error("Version này đã publish rồi");

  await prisma.$transaction([
    prisma.workflowVersion.update({ where: { id: workflow.currentVersion.id }, data: { publishedAt: new Date() } }),
    prisma.workflow.update({ where: { id: workflowId }, data: { isActive: true } }),
  ]);
  await writeAuditLog({
    organizationId,
    actorId,
    action: "workflow.publish",
    entityType: "Workflow",
    entityId: workflowId,
    after: { version: workflow.currentVersion.version },
  });
}

/** Cấu hình kích hoạt tự động (Phase 9 — Automation Engine): `eventType = null`
 * nghĩa là chỉ chạy thủ công (Chạy thử). Có giá trị → mỗi khi
 * `services/analytics/events.ts#writeEvent` ghi 1 event MỚI cùng type này trong tổ
 * chức, workflow (nếu đã publish + active) tự chạy — xem services/process/automation.ts. */
export async function setTriggerEventType(organizationId: string, actorId: string, id: string, eventType: string | null) {
  const before = await prisma.workflow.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy workflow");
  await prisma.workflow.update({ where: { id }, data: { triggerEventType: eventType } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "workflow.set_trigger_event_type",
    entityType: "Workflow",
    entityId: id,
    before: { triggerEventType: before.triggerEventType },
    after: { triggerEventType: eventType },
  });
}

export async function setWorkflowActive(organizationId: string, actorId: string, id: string, isActive: boolean) {
  const before = await prisma.workflow.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy workflow");
  await prisma.workflow.update({ where: { id }, data: { isActive } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: isActive ? "workflow.activate" : "workflow.deactivate",
    entityType: "Workflow",
    entityId: id,
  });
}
