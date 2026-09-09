"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createPipeline, renamePipeline, deletePipeline, addStage, removeStage } from "@/services/crm/pipelines";

const stageSchema = z.object({ name: z.string().trim().min(1), type: z.enum(["OPEN", "WON", "LOST"]) });

export async function createPipelineAction(formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const name = z.string().trim().min(1, "Cần nhập tên pipeline").parse(formData.get("name"));
  const stagesJson = JSON.parse(String(formData.get("stagesJson") || "[]"));
  const stages = z.array(stageSchema).min(1, "Cần ít nhất 1 giai đoạn").parse(stagesJson);
  await createPipeline(session.user.organizationId, session.user.id, { name, stages });
  revalidatePath("/crm/pipelines");
}

export async function renamePipelineAction(pipelineId: string, formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const name = z.string().trim().min(1, "Cần nhập tên pipeline").parse(formData.get("name"));
  await renamePipeline(session.user.organizationId, session.user.id, pipelineId, name);
  revalidatePath("/crm/pipelines");
}

export async function deletePipelineAction(pipelineId: string) {
  const session = await assertPermission("sales_catalog.manage");
  await deletePipeline(session.user.organizationId, session.user.id, pipelineId);
  revalidatePath("/crm/pipelines");
}

export async function addStageAction(pipelineId: string, formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const parsed = stageSchema.parse({ name: formData.get("name"), type: formData.get("type") });
  await addStage(session.user.organizationId, pipelineId, parsed);
  revalidatePath("/crm/pipelines");
}

export async function removeStageAction(stageId: string) {
  const session = await assertPermission("sales_catalog.manage");
  await removeStage(session.user.organizationId, stageId);
  revalidatePath("/crm/pipelines");
}
