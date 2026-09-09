"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createLead, updateLead, deleteLead, moveLeadStage, addLeadActivity, convertLeadToCustomer } from "@/services/crm/leads";

const LEAD_SOURCE_ENUM = z.enum(["MANUAL", "WEBSITE", "REFERRAL", "ADS", "EVENT", "OTHER"]);
const LEAD_ACTIVITY_TYPE_ENUM = z.enum(["NOTE", "CALL", "EMAIL", "MEETING"]);

const leadSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên lead"),
  contactName: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  source: LEAD_SOURCE_ENUM,
  value: z.coerce.number().min(0).optional(),
  ownerId: z.string().trim().optional(),
});

export async function createLeadAction(pipelineId: string, stageId: string, formData: FormData) {
  const session = await assertPermission("leads.create");
  const parsed = leadSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    source: formData.get("source"),
    value: formData.get("value") || undefined,
    ownerId: formData.get("ownerId") || undefined,
  });
  await createLead(session.user.organizationId, session.user.id, { ...parsed, pipelineId, stageId });
  revalidatePath("/crm/leads");
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const session = await assertPermission("leads.update");
  const parsed = leadSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    source: formData.get("source"),
    value: formData.get("value") || undefined,
    ownerId: formData.get("ownerId") || undefined,
  });
  await updateLead(session.user.organizationId, session.user.id, leadId, parsed);
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function deleteLeadAction(leadId: string) {
  const session = await assertPermission("leads.delete");
  await deleteLead(session.user.organizationId, session.user.id, leadId);
  revalidatePath("/crm/leads");
}

export async function moveLeadStageAction(leadId: string, stageId: string) {
  const session = await assertPermission("leads.update");
  await moveLeadStage(session.user.organizationId, session.user.id, leadId, stageId);
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function addLeadActivityAction(leadId: string, type: string, content: string) {
  const session = await assertPermission("leads.update");
  const parsedType = LEAD_ACTIVITY_TYPE_ENUM.parse(type);
  await addLeadActivity(session.user.organizationId, session.user.id, leadId, { type: parsedType, content });
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function convertLeadAction(leadId: string) {
  const session = await assertPermission("leads.update");
  const customer = await convertLeadToCustomer(session.user.organizationId, session.user.id, leadId);
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm/customers");
  return customer;
}
