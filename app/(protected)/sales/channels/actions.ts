"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createSalesChannel, updateSalesChannel, deleteSalesChannel } from "@/services/sales/channels";

const channelSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên kênh"),
  type: z.enum(["ONLINE", "RETAIL", "PARTNER", "MARKETPLACE", "OTHER"]),
});

export async function createChannelAction(formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const parsed = channelSchema.parse({ name: formData.get("name"), type: formData.get("type") });
  await createSalesChannel(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/sales/channels");
}

export async function updateChannelAction(channelId: string, formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const parsed = channelSchema.parse({ name: formData.get("name"), type: formData.get("type") });
  await updateSalesChannel(session.user.organizationId, session.user.id, channelId, {
    ...parsed,
    isActive: formData.get("isActive") === "true",
  });
  revalidatePath("/sales/channels");
}

export async function deleteChannelAction(channelId: string) {
  const session = await assertPermission("sales_catalog.manage");
  await deleteSalesChannel(session.user.organizationId, session.user.id, channelId);
  revalidatePath("/sales/channels");
}
