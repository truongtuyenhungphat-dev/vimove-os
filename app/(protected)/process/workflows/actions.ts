"use server";

import { z } from "zod";
import { assertPermission } from "@/lib/auth/rbac";
import {
  createWorkflow,
  renameWorkflow,
  deleteWorkflow,
  saveDraft,
  publishCurrentVersion,
  setWorkflowActive,
  setTriggerEventType,
} from "@/services/process/workflows";
import { startWorkflowRun } from "@/services/process/workflow-engine";
import type { WorkflowDefinition } from "@/lib/process/types";
import { revalidatePath } from "next/cache";

function revalidateWorkflowViews(workflowId?: string) {
  revalidatePath("/process/workflows");
  if (workflowId) revalidatePath(`/process/workflows/${workflowId}`);
}

export async function createWorkflowAction(formData: FormData) {
  const session = await assertPermission("workflows.manage");
  const parsed = z.object({ name: z.string().trim().min(1), description: z.string().trim().optional() }).parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  const workflow = await createWorkflow(session.user.organizationId, session.user.id, parsed);
  revalidateWorkflowViews();
  return workflow.id;
}

export async function renameWorkflowAction(workflowId: string, formData: FormData) {
  const session = await assertPermission("workflows.manage");
  const parsed = z.object({ name: z.string().trim().min(1), description: z.string().trim().optional() }).parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  await renameWorkflow(session.user.organizationId, session.user.id, workflowId, parsed);
  revalidateWorkflowViews(workflowId);
}

export async function deleteWorkflowAction(workflowId: string) {
  const session = await assertPermission("workflows.manage");
  await deleteWorkflow(session.user.organizationId, session.user.id, workflowId);
  revalidateWorkflowViews(workflowId);
}

export async function saveDraftAction(workflowId: string, definition: WorkflowDefinition) {
  const session = await assertPermission("workflows.manage");
  await saveDraft(session.user.organizationId, session.user.id, workflowId, definition);
  revalidateWorkflowViews(workflowId);
}

export async function publishAction(workflowId: string) {
  const session = await assertPermission("workflows.manage");
  await publishCurrentVersion(session.user.organizationId, session.user.id, workflowId);
  revalidateWorkflowViews(workflowId);
}

export async function setActiveAction(workflowId: string, isActive: boolean) {
  const session = await assertPermission("workflows.manage");
  await setWorkflowActive(session.user.organizationId, session.user.id, workflowId, isActive);
  revalidateWorkflowViews(workflowId);
}

export async function setTriggerEventTypeAction(workflowId: string, eventType: string) {
  const session = await assertPermission("workflows.manage");
  await setTriggerEventType(session.user.organizationId, session.user.id, workflowId, eventType || null);
  revalidateWorkflowViews(workflowId);
}

export async function runWorkflowAction(workflowId: string) {
  const session = await assertPermission("workflows.manage");
  const run = await startWorkflowRun(session.user.organizationId, session.user.id, workflowId, { triggeredBy: session.user.name });
  revalidateWorkflowViews(workflowId);
  return run.id;
}
