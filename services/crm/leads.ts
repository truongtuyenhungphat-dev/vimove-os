import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { writeEvent } from "@/services/analytics/events";
import type { LeadActivityType, LeadSource } from "@/lib/crm/types";

const leadCardInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  stage: { select: { id: true, name: true, type: true } },
} as const;

// Lead.value là Decimal — không serialize được thẳng qua RSC boundary (Server
// Component → Client Component), luôn convert sang number ở biên service layer.
function serializeLead<T extends { value: unknown }>(lead: T) {
  return { ...lead, value: lead.value === null ? null : Number(lead.value) };
}

/** Phase 10 — Scale: scope cho `leads.read`, xem cùng cơ chế ở services/tasks/tasks.ts#TaskVisibility. */
export type LeadVisibility = { scope: "ALL" | "DEPARTMENT" | "OWN"; userId: string; departmentId: string | null };

export async function listLeadsBoard(organizationId: string, pipelineId: string, visibility?: LeadVisibility) {
  const leads = await prisma.lead.findMany({
    where: {
      organizationId,
      pipelineId,
      ...(visibility?.scope === "OWN" ? { ownerId: visibility.userId } : {}),
      ...(visibility?.scope === "DEPARTMENT" ? { owner: { departmentId: visibility.departmentId } } : {}),
    },
    include: leadCardInclude,
    orderBy: { createdAt: "desc" },
  });
  return leads.map(serializeLead);
}

export async function listMyLeads(organizationId: string, userId: string) {
  const leads = await prisma.lead.findMany({
    where: { organizationId, ownerId: userId },
    include: leadCardInclude,
    orderBy: { createdAt: "desc" },
  });
  return leads.map(serializeLead);
}

export async function getLead(organizationId: string, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      pipeline: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true, type: true } },
      customer: { select: { id: true, name: true } },
      activities: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return lead ? serializeLead(lead) : null;
}

export async function createLead(
  organizationId: string,
  actorId: string,
  data: {
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    source: LeadSource;
    value?: number | null;
    pipelineId: string;
    stageId: string;
    ownerId?: string | null;
  }
) {
  const lead = await prisma.lead.create({
    data: {
      organizationId,
      name: data.name,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source,
      value: data.value ?? null,
      pipelineId: data.pipelineId,
      stageId: data.stageId,
      ownerId: data.ownerId || actorId,
      activities: { create: { actorId, type: "NOTE", content: "Tạo lead" } },
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "lead.create", entityType: "Lead", entityId: lead.id, after: { name: lead.name } });
  await writeEvent({ organizationId, type: "lead.created", entityType: "Lead", entityId: lead.id, occurredAt: lead.createdAt });
  return lead;
}

export async function updateLead(
  organizationId: string,
  actorId: string,
  id: string,
  data: {
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    source: LeadSource;
    value?: number | null;
    ownerId?: string | null;
  }
) {
  const before = await prisma.lead.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy lead");
  const updated = await prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source,
      value: data.value ?? null,
      ownerId: data.ownerId || null,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "lead.update", entityType: "Lead", entityId: id, before: { name: before.name }, after: { name: updated.name } });
  return updated;
}

export async function deleteLead(organizationId: string, actorId: string, id: string) {
  const before = await prisma.lead.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy lead");
  await prisma.lead.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "lead.delete", entityType: "Lead", entityId: id, before: { name: before.name } });
}

/** Kéo-thả trên pipeline board: đổi stage, tự ghi LeadActivity + set wonAt/lostAt
 * theo type của stage đích (không yêu cầu thứ tự tuần tự — CRM không có khái niệm
 * "chặn vi phạm" như dependency ở Work Hub, chỉ cần đúng transition thật). */
export async function moveLeadStage(organizationId: string, actorId: string, leadId: string, stageId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId } });
  if (!lead) throw new Error("Không tìm thấy lead");
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId: lead.pipelineId } });
  if (!stage) throw new Error("Giai đoạn không thuộc đúng pipeline của lead này");
  if (stage.id === lead.stageId) return lead;

  const fromStage = await prisma.pipelineStage.findUnique({ where: { id: lead.stageId } });

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.lead.update({
      where: { id: leadId },
      data: {
        stageId,
        wonAt: stage.type === "WON" ? new Date() : lead.wonAt,
        lostAt: stage.type === "LOST" ? new Date() : lead.lostAt,
      },
    });
    await tx.leadActivity.create({
      data: {
        leadId,
        actorId,
        type: "STAGE_CHANGED",
        content: `${fromStage?.name ?? "?"} → ${stage.name}`,
        payload: { fromStageId: lead.stageId, toStageId: stageId },
      },
    });
    return result;
  });

  await writeAuditLog({
    organizationId,
    actorId,
    action: "lead.stage_change",
    entityType: "Lead",
    entityId: leadId,
    before: { stageId: lead.stageId },
    after: { stageId },
  });
  if (stage.type === "WON") {
    await writeEvent({ organizationId, type: "lead.won", entityType: "Lead", entityId: leadId, occurredAt: updated.wonAt ?? new Date() });
  }
  return updated;
}

export async function addLeadActivity(
  organizationId: string,
  actorId: string,
  leadId: string,
  data: { type: LeadActivityType; content: string }
) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId } });
  if (!lead) throw new Error("Không tìm thấy lead");
  return prisma.leadActivity.create({ data: { leadId, actorId, type: data.type, content: data.content } });
}

/** Chuyển lead thành Customer thật (tạo mới hoặc gắn vào Customer đã có theo email
 * trùng khớp) — dùng khi lead ở stage type WON, nhưng không bắt buộc (Sales có thể
 * convert sớm nếu deal coi như chắc chắn). */
export async function convertLeadToCustomer(organizationId: string, actorId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId } });
  if (!lead) throw new Error("Không tìm thấy lead");
  if (lead.customerId) throw new Error("Lead này đã được chuyển thành khách hàng");

  const existing = lead.email
    ? await prisma.customer.findFirst({ where: { organizationId, email: lead.email } })
    : null;

  const customer = await prisma.$transaction(async (tx) => {
    const c =
      existing ??
      (await tx.customer.create({
        data: {
          organizationId,
          name: lead.contactName || lead.name,
          email: lead.email,
          phone: lead.phone,
          ownerId: lead.ownerId,
        },
      }));
    await tx.lead.update({ where: { id: leadId }, data: { customerId: c.id } });
    await tx.leadActivity.create({
      data: { leadId, actorId, type: "CONVERTED", content: `Đã chuyển thành khách hàng "${c.name}"` },
    });
    return c;
  });

  await writeAuditLog({
    organizationId,
    actorId,
    action: "lead.convert",
    entityType: "Lead",
    entityId: leadId,
    after: { customerId: customer.id },
  });
  return customer;
}
