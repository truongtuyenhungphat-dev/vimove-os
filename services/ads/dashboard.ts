import "server-only";
import { prisma } from "@/lib/db/client";

/** Tổng hợp hiệu suất theo ad account — công thức chuẩn ngành (đúng nghiệm thu
 * "ad_metrics_daily có currency/timezone chuẩn hoá"): CTR = clicks/impressions,
 * CPC = spend/clicks, CPM = spend/impressions*1000. Trả 0 khi mẫu số = 0. */
export async function listAdAccountSummaries(organizationId: string) {
  const accounts = await prisma.adAccount.findMany({
    where: { connection: { organizationId } },
    include: {
      connection: { select: { platform: true, status: true } },
      campaigns: { select: { id: true, name: true, status: true } },
      metrics: true,
    },
  });

  return accounts.map((account) => {
    const impressions = account.metrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = account.metrics.reduce((sum, m) => sum + m.clicks, 0);
    const spend = account.metrics.reduce((sum, m) => sum + Number(m.spend), 0);
    const conversions = account.metrics.reduce((sum, m) => sum + m.conversions, 0);
    const latestSync = account.metrics.reduce<Date | null>((latest, m) => (!latest || m.syncedAt > latest ? m.syncedAt : latest), null);

    return {
      id: account.id,
      name: account.name,
      currency: account.currency,
      timezone: account.timezone,
      platform: account.connection.platform,
      campaignCount: account.campaigns.length,
      metrics: {
        impressions,
        clicks,
        spend,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      },
      latestSyncedAt: latestSync,
    };
  });
}
