"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createLandingPage, updateLandingPage, deleteLandingPage } from "@/services/marketing/landing-pages";

const landingPageBaseSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên"),
  campaignId: z.string().trim().optional(),
  headline: z.string().trim().min(1, "Cần nhập tiêu đề"),
  body: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaUrl: z.string().trim().optional(),
});

export async function createLandingPageAction(formData: FormData) {
  const session = await assertPermission("marketing_channels.manage");
  const slug = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    .parse(formData.get("slug"));
  const parsed = landingPageBaseSchema.parse({
    name: formData.get("name"),
    campaignId: formData.get("campaignId") || undefined,
    headline: formData.get("headline"),
    body: formData.get("body") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaUrl: formData.get("ctaUrl") || undefined,
  });
  await createLandingPage(session.user.organizationId, session.user.id, {
    name: parsed.name,
    slug,
    campaignId: parsed.campaignId || null,
    headline: parsed.headline,
    body: parsed.body || null,
    ctaLabel: parsed.ctaLabel || null,
    ctaUrl: parsed.ctaUrl || null,
  });
  revalidatePath("/marketing/landing-pages");
}

export async function updateLandingPageAction(id: string, formData: FormData) {
  const session = await assertPermission("marketing_channels.manage");
  const parsed = landingPageBaseSchema.extend({ status: z.enum(["DRAFT", "PUBLISHED"]) }).parse({
    name: formData.get("name"),
    campaignId: formData.get("campaignId") || undefined,
    headline: formData.get("headline"),
    body: formData.get("body") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaUrl: formData.get("ctaUrl") || undefined,
    status: formData.get("status"),
  });
  await updateLandingPage(session.user.organizationId, session.user.id, id, {
    name: parsed.name,
    status: parsed.status,
    campaignId: parsed.campaignId || null,
    headline: parsed.headline,
    body: parsed.body || null,
    ctaLabel: parsed.ctaLabel || null,
    ctaUrl: parsed.ctaUrl || null,
  });
  revalidatePath("/marketing/landing-pages");
  revalidatePath(`/marketing/landing-pages/${id}`);
}

export async function deleteLandingPageAction(id: string) {
  const session = await assertPermission("marketing_channels.manage");
  await deleteLandingPage(session.user.organizationId, session.user.id, id);
  revalidatePath("/marketing/landing-pages");
}
