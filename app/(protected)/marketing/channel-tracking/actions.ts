"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createTrackedChannel, updateTrackedChannel, removeTrackedChannel, getChannelHistory } from "@/services/channel-tracking/channels";
import { startDailyScrape, updatePlatformConfig } from "@/services/channel-tracking/apify";
import { PLATFORMS, TRACKED_CHANNEL_STATUSES, CONFIG_PLATFORMS } from "@/lib/channel-tracking/types";

const PATH = "/marketing/channel-tracking";

const addSchema = z.object({
  platform: z.enum([...PLATFORMS] as [string, ...string[]]),
  url: z.string().trim().min(1, "Cần nhập link kênh"),
  label: z.string().trim().optional(),
});

export async function addChannelAction(formData: FormData) {
  const session = await assertPermission("channel_tracking.create");
  const parsed = addSchema.parse({
    platform: formData.get("platform"),
    url: formData.get("url"),
    label: formData.get("label") || undefined,
  });
  await createTrackedChannel(session.user.organizationId, session.user.id, parsed);
  revalidatePath(PATH);
}

const updateSchema = z.object({
  label: z.string().trim().optional(),
  status: z.enum([...TRACKED_CHANNEL_STATUSES] as [string, ...string[]]).optional(),
  url: z.string().trim().optional(),
});

export async function updateChannelAction(id: string, data: { label?: string; status?: string; url?: string }) {
  const session = await assertPermission("channel_tracking.update");
  const parsed = updateSchema.parse(data);
  await updateTrackedChannel(session.user.organizationId, session.user.id, id, parsed as never);
  revalidatePath(PATH);
}

export async function getChannelHistoryAction(id: string, days = 30) {
  const session = await assertPermission("channel_tracking.read");
  return getChannelHistory(session.user.organizationId, id, days);
}

export async function deleteChannelAction(id: string) {
  const session = await assertPermission("channel_tracking.delete");
  await removeTrackedChannel(session.user.organizationId, session.user.id, id);
  revalidatePath(PATH);
}

export async function scrapeNowAction() {
  const session = await assertPermission("channel_tracking.update");
  if (!process.env.APIFY_TOKEN) throw new Error("Chưa cấu hình APIFY_TOKEN");
  const result = await startDailyScrape(session.user.organizationId);
  revalidatePath(PATH);
  return result;
}

const configSchema = z.object({
  platform: z.enum(CONFIG_PLATFORMS as [string, ...string[]]),
  apifyActor: z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, "Actor phải dạng ten-tac-gia/ten-actor").optional(),
  isActive: z.boolean().optional(),
});

export async function updatePlatformConfigAction(data: { platform: string; apifyActor?: string; isActive?: boolean }) {
  const session = await assertPermission("channel_tracking.update");
  const parsed = configSchema.parse(data);
  await updatePlatformConfig(session.user.organizationId, session.user.id, parsed as never);
  revalidatePath(PATH);
}
