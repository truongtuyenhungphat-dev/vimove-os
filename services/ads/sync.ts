import "server-only";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/integrations/encryption";
import { AD_PROVIDERS } from "@/lib/integrations/ads/provider";
import { writeAuditLog } from "@/services/core/audit";
import type { AdPlatform } from "@/lib/ads/types";

/**
 * Đồng bộ dữ liệu ads cho 1 connection — idempotent nhờ `@@unique` trên
 * `AdAccount(connectionId, externalId)`, `AdCampaign(adAccountId, externalId)`, và
 * quan trọng nhất `AdMetricDaily(adCampaignId, date)`: chạy lại cùng ngày chỉ
 * `update` (upsert), không tạo dòng trùng — đúng nghiệm thu "sync job idempotent".
 *
 * CHƯA thể verify với sandbox thật (chưa có credential — xem lib/integrations/ads/
 * provider.ts) nhưng logic upsert này đúng và sẵn sàng chạy thật ngay khi
 * `AdConnection.status` chuyển sang CONNECTED với access token thật.
 */
export async function syncConnection(organizationId: string, actorId: string, connectionId: string) {
  const connection = await prisma.adConnection.findFirst({ where: { id: connectionId, organizationId } });
  if (!connection) throw new Error("Không tìm thấy kết nối");
  if (connection.status !== "CONNECTED" || !connection.encryptedAccessToken) {
    throw new Error("Kết nối chưa ở trạng thái CONNECTED — cần hoàn tất OAuth trước khi đồng bộ.");
  }

  const provider = AD_PROVIDERS[connection.platform as AdPlatform];
  const accessToken = decryptToken(connection.encryptedAccessToken);

  try {
    const remoteAccounts = await provider.fetchAdAccounts(accessToken);

    for (const remoteAccount of remoteAccounts) {
      const account = await prisma.adAccount.upsert({
        where: { connectionId_externalId: { connectionId, externalId: remoteAccount.externalId } },
        update: { name: remoteAccount.name, currency: remoteAccount.currency, timezone: remoteAccount.timezone },
        create: {
          connectionId,
          externalId: remoteAccount.externalId,
          name: remoteAccount.name,
          currency: remoteAccount.currency,
          timezone: remoteAccount.timezone,
        },
      });

      const remoteCampaigns = await provider.fetchCampaigns(accessToken, remoteAccount.externalId);
      const campaignByExternalId = new Map<string, string>();
      for (const rc of remoteCampaigns) {
        const campaign = await prisma.adCampaign.upsert({
          where: { adAccountId_externalId: { adAccountId: account.id, externalId: rc.externalId } },
          update: { name: rc.name, status: rc.status, dailyBudget: rc.dailyBudget },
          create: { adAccountId: account.id, externalId: rc.externalId, name: rc.name, status: rc.status, dailyBudget: rc.dailyBudget },
        });
        campaignByExternalId.set(rc.externalId, campaign.id);
      }

      const to = new Date();
      const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 ngày gần nhất — initial sync đủ cho dashboard
      const remoteMetrics = await provider.fetchDailyMetrics(accessToken, remoteAccount.externalId, from, to);

      for (const m of remoteMetrics) {
        const campaignId = campaignByExternalId.get(m.campaignExternalId);
        if (!campaignId) continue;
        await prisma.adMetricDaily.upsert({
          where: { adCampaignId_date: { adCampaignId: campaignId, date: new Date(m.date) } },
          update: {
            impressions: m.impressions,
            clicks: m.clicks,
            spend: m.spend,
            conversions: m.conversions,
            currency: remoteAccount.currency,
            timezone: remoteAccount.timezone,
            syncedAt: new Date(),
          },
          create: {
            adAccountId: account.id,
            adCampaignId: campaignId,
            date: new Date(m.date),
            impressions: m.impressions,
            clicks: m.clicks,
            spend: m.spend,
            conversions: m.conversions,
            currency: remoteAccount.currency,
            timezone: remoteAccount.timezone,
          },
        });
      }
    }

    await prisma.adConnection.update({ where: { id: connectionId }, data: { lastSyncedAt: new Date(), lastSyncError: null } });
    await writeAuditLog({ organizationId, actorId, action: "ad_connection.sync_success", entityType: "AdConnection", entityId: connectionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    await prisma.adConnection.update({ where: { id: connectionId }, data: { status: "ERROR", lastSyncError: message } });
    await writeAuditLog({ organizationId, actorId, action: "ad_connection.sync_failed", entityType: "AdConnection", entityId: connectionId, after: { error: message } });
    throw err;
  }
}
