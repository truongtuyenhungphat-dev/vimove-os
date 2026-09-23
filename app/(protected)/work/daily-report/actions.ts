"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import {
  addAdhocItem,
  updateReportItem,
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
} from "@/services/work/daily-reports";
import { DAILY_REPORT_ITEM_STATUSES, todayVN } from "@/lib/work/daily-report-types";

const PATH = "/work/daily-report";
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const adhocSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tên việc"),
  priority: z.enum(PRIORITIES).optional(),
});

export async function addAdhocItemAction(formData: FormData) {
  const session = await assertPermission("daily_reports.update");
  const parsed = adhocSchema.parse({
    title: formData.get("title"),
    priority: formData.get("priority") || undefined,
  });
  await addAdhocItem(session.user.organizationId, session.user.id, { ...parsed, date: todayVN() });
  revalidatePath(PATH);
}

const updateItemSchema = z.object({
  status: z.enum(DAILY_REPORT_ITEM_STATUSES).optional(),
  note: z.string().max(1000).optional(),
});

export async function updateReportItemAction(id: string, data: { status?: string; note?: string }) {
  const session = await assertPermission("daily_reports.update");
  const parsed = updateItemSchema.parse(data);
  await updateReportItem(session.user.organizationId, session.user.id, id, parsed as never);
  revalidatePath(PATH);
}

const templateSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tên việc"),
  roleTitle: z.string().trim().min(1, "Cần chọn vai trò áp dụng"),
  priority: z.enum(PRIORITIES).optional(),
});

export async function createTemplateAction(formData: FormData) {
  const session = await assertPermission("daily_reports.manage_templates");
  const parsed = templateSchema.parse({
    title: formData.get("title"),
    roleTitle: formData.get("roleTitle"),
    priority: formData.get("priority") || undefined,
  });
  await createRecurringTemplate(session.user.organizationId, session.user.id, parsed);
  revalidatePath(PATH);
}

const updateTemplateSchema = z.object({
  title: z.string().trim().min(1, "Cần nhập tên việc"),
  priority: z.enum(PRIORITIES).optional(),
});

export async function updateTemplateAction(id: string, data: { title: string; priority?: string }) {
  const session = await assertPermission("daily_reports.manage_templates");
  const parsed = updateTemplateSchema.parse(data);
  await updateRecurringTemplate(session.user.organizationId, session.user.id, id, parsed as never);
  revalidatePath(PATH);
}

export async function deleteTemplateAction(id: string) {
  const session = await assertPermission("daily_reports.manage_templates");
  await deleteRecurringTemplate(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}
