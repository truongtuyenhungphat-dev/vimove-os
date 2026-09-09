import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { AD_PROVIDERS } from "@/lib/integrations/ads/provider";
import type { AdPlatform } from "@/lib/ads/types";

const ALL_PLATFORMS: AdPlatform[] = ["META", "GOOGLE", "TIKTOK", "ZALO"];

/** Trộn AdConnection thật (nếu có) với trạng thái `isConfigured()` của provider —
 * UI cần biết cả 2: đã kết nối chưa VÀ có thể kết nối được không (đủ env var chưa). */
export async function listConnections(organizationId: string) {
  const connections = await prisma.adConnection.findMany({
    where: { organizationId },
    include: { connectedBy: { select: { id: true, name: true } }, adAccounts: { select: { id: true } } },
  });
  const byPlatform = new Map(connections.map((c) => [c.platform, c]));

  return ALL_PLATFORMS.map((platform) => {
    const connection = byPlatform.get(platform) ?? null;
    return {
      platform,
      isConfigured: AD_PROVIDERS[platform].isConfigured(),
      connection: connection
        ? {
            id: connection.id,
            status: connection.status,
            accountLabel: connection.accountLabel,
            connectedBy: connection.connectedBy,
            lastSyncedAt: connection.lastSyncedAt,
            lastSyncError: connection.lastSyncError,
            adAccountCount: connection.adAccounts.length,
          }
        : null,
    };
  });
}

/** Bắt đầu kết nối — CHƯA có OAuth thật nên luôn throw lỗi rõ ràng nếu chưa cấu hình
 * (không giả vờ thành công). Khi có credential thật, hàm này sẽ trả về
 * `getAuthorizationUrl()` để redirect user sang trang cấp quyền của provider. */
export function startConnect(platform: AdPlatform) {
  const provider = AD_PROVIDERS[platform];
  if (!provider.isConfigured()) {
    throw new Error(`Chưa cấu hình ${platform} — cần thiết lập biến môi trường App ID/Secret trước khi kết nối.`);
  }
  const state = crypto.randomUUID();
  const redirectUri = `${process.env.NEXTAUTH_URL ?? ""}/api/integrations/ads/${platform.toLowerCase()}/callback`;
  return provider.getAuthorizationUrl(state, redirectUri);
}

export async function disconnectConnection(organizationId: string, actorId: string, connectionId: string) {
  const before = await prisma.adConnection.findFirst({ where: { id: connectionId, organizationId } });
  if (!before) throw new Error("Không tìm thấy kết nối");
  await prisma.adConnection.update({ where: { id: connectionId }, data: { status: "DISCONNECTED", encryptedAccessToken: null, encryptedRefreshToken: null } });
  await writeAuditLog({ organizationId, actorId, action: "ad_connection.disconnect", entityType: "AdConnection", entityId: connectionId, before: { platform: before.platform } });
}
