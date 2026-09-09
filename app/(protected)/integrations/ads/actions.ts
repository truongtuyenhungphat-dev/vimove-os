"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { startConnect, disconnectConnection } from "@/services/ads/connections";
import { syncConnection } from "@/services/ads/sync";

const platformSchema = z.enum(["META", "GOOGLE", "TIKTOK", "ZALO"]);

/** Trả về authorization URL để redirect — hoặc throw lỗi rõ ràng nếu chưa cấu hình
 * (chưa có credential thật, xem lib/integrations/ads/provider.ts). */
export async function startConnectAction(platform: string) {
  await assertPermission("ads.manage");
  const parsed = platformSchema.parse(platform);
  return startConnect(parsed);
}

export async function disconnectAction(connectionId: string) {
  const session = await assertPermission("ads.manage");
  await disconnectConnection(session.user.organizationId, session.user.id, connectionId);
  revalidatePath("/integrations/ads");
}

export async function syncAction(connectionId: string) {
  const session = await assertPermission("ads.manage");
  await syncConnection(session.user.organizationId, session.user.id, connectionId);
  revalidatePath("/integrations/ads");
}
