import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { writeEvent } from "@/services/analytics/events";
import type { CampaignStatus, MarketingChannelType } from "@/lib/marketing/types";

/**
 * Công thức KPI chiến dịch (§ nghiệm thu Phase 5: "công thức và luồng dữ liệu phải
 * đúng" dù Spend có thể là 0 khi chưa nối Ads ở Phase 6):
 * - Spend: tổng chi tiêu ads thật — CHƯA có bảng `ad_metrics_daily` (Phase 6) nên
 *   luôn = 0 ở phase này. Không phải giả — là 0 vì chưa có nguồn dữ liệu, sẽ tự động
 *   đúng khi Phase 6 nối xong (chỉ cần cộng thêm 1 query, không đổi công thức bên dưới).
 * - Revenue: tổng Order.totalAmount (loại CANCELLED/REFUNDED) của khách hàng có Lead
 *   gắn campaignId này — attribution 1 chạm (lead → customer → order), attribution
 *   đa chạm thật (first/last-touch) là việc của Phase 7.
 * - Leads: số Lead có campaignId này.
 * - Orders: số Order (không CANCELLED/REFUNDED) từ khách hàng quy về Lead của
 *   campaign này.
 * - ROAS = Revenue / Spend (0 nếu Spend = 0, tránh chia 0).
 * - CPL = Spend / Leads (0 nếu Leads = 0).
 * - CAC = Spend / số khách hàng duy nhất được quy về (0 nếu không có khách hàng nào).
 * - Profit = Revenue - Spend.
 */
export type CampaignKpis = {
  spend: number;
  revenue: number;
  roas: number;
  leads: number;
  cpl: number;
  orders: number;
  cac: number;
  profit: number;
};

function kpisFromTotals(spend: number, leadCount: number, revenue: number, orderCount: number, acquiredCustomers: number): CampaignKpis {
  return {
    spend,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
    leads: leadCount,
    cpl: leadCount > 0 ? spend / leadCount : 0,
    orders: orderCount,
    cac: acquiredCustomers > 0 ? spend / acquiredCustomers : 0,
    profit: revenue - spend,
  };
}

async function computeKpis(organizationId: string, campaignId: string): Promise<CampaignKpis> {
  const spend = 0; // Chưa có ad_metrics_daily (Phase 6).

  const leads = await prisma.lead.findMany({
    where: { organizationId, campaignId },
    select: { id: true, customerId: true },
  });
  const customerIds = [...new Set(leads.map((l) => l.customerId).filter((id): id is string => !!id))];

  const orders =
    customerIds.length > 0
      ? await prisma.order.findMany({
          where: { organizationId, customerId: { in: customerIds }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
          select: { totalAmount: true },
        })
      : [];

  const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  return kpisFromTotals(spend, leads.length, revenue, orders.length, customerIds.length);
}

/**
 * Tính KPI cho NHIỀU chiến dịch trong đúng 2 query bất kể số lượng campaign (Phase 9
 * → Phase 10 tối ưu N+1: `listCampaigns()` trước đây gọi `computeKpis()` per-campaign
 * bên trong `Promise.all`, tức 1 + 2N query cho N campaign — với N campaign cùng có
 * lead, mỗi campaign lại thêm 1 query lead + 1 query order riêng). Ở đây lấy TOÀN BỘ
 * lead của org theo campaignId trong 1 query, TOÀN BỘ order theo customerId liên quan
 * trong 1 query, rồi group lại trong bộ nhớ — tổng luôn là 2 query, không phụ thuộc N.
 * Xem benchmark thật trong docs/10-scale.md.
 */
async function computeKpisForCampaigns(organizationId: string, campaignIds: string[]): Promise<Map<string, CampaignKpis>> {
  const result = new Map<string, CampaignKpis>();
  if (campaignIds.length === 0) return result;

  const leads = await prisma.lead.findMany({
    where: { organizationId, campaignId: { in: campaignIds } },
    select: { campaignId: true, customerId: true },
  });
  const leadsByCampaign = new Map<string, { customerId: string | null }[]>();
  for (const lead of leads) {
    if (!lead.campaignId) continue;
    const arr = leadsByCampaign.get(lead.campaignId) ?? [];
    arr.push({ customerId: lead.customerId });
    leadsByCampaign.set(lead.campaignId, arr);
  }

  const allCustomerIds = [...new Set(leads.map((l) => l.customerId).filter((id): id is string => !!id))];
  const orders =
    allCustomerIds.length > 0
      ? await prisma.order.findMany({
          where: { organizationId, customerId: { in: allCustomerIds }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
          select: { customerId: true, totalAmount: true },
        })
      : [];
  const ordersByCustomer = new Map<string, number[]>();
  for (const order of orders) {
    const arr = ordersByCustomer.get(order.customerId) ?? [];
    arr.push(Number(order.totalAmount));
    ordersByCustomer.set(order.customerId, arr);
  }

  for (const campaignId of campaignIds) {
    const campaignLeads = leadsByCampaign.get(campaignId) ?? [];
    const customerIds = [...new Set(campaignLeads.map((l) => l.customerId).filter((id): id is string => !!id))];
    const amounts = customerIds.flatMap((id) => ordersByCustomer.get(id) ?? []);
    const revenue = amounts.reduce((sum, a) => sum + a, 0);
    result.set(campaignId, kpisFromTotals(0, campaignLeads.length, revenue, amounts.length, customerIds.length));
  }
  return result;
}

export async function listCampaigns(organizationId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { channels: true, contents: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const kpisByCampaign = await computeKpisForCampaigns(organizationId, campaigns.map((c) => c.id));
  return campaigns.map((c) => ({
    ...c,
    budget: c.budget === null ? null : Number(c.budget),
    kpis: kpisByCampaign.get(c.id) ?? kpisFromTotals(0, 0, 0, 0, 0),
  }));
}

export async function getCampaign(organizationId: string, id: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id, organizationId },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      channels: { orderBy: { createdAt: "asc" } },
      contents: { select: { id: true, title: true, status: true, type: true }, orderBy: { createdAt: "desc" } },
      leads: {
        select: { id: true, name: true, value: true, stage: { select: { name: true, type: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!campaign) return null;
  const kpis = await computeKpis(organizationId, id);
  return {
    ...campaign,
    budget: campaign.budget === null ? null : Number(campaign.budget),
    channels: campaign.channels.map((ch) => ({ ...ch, plannedBudget: ch.plannedBudget === null ? null : Number(ch.plannedBudget) })),
    leads: campaign.leads.map((l) => ({ ...l, value: l.value === null ? null : Number(l.value) })),
    kpis,
  };
}

export async function createCampaign(
  organizationId: string,
  actorId: string,
  data: { name: string; description?: string | null; projectId?: string | null; budget?: number | null; startAt?: Date | null; endAt?: Date | null }
) {
  const campaign = await prisma.campaign.create({
    data: {
      organizationId,
      name: data.name,
      description: data.description || null,
      projectId: data.projectId || null,
      budget: data.budget ?? null,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
      createdById: actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "campaign.create", entityType: "Campaign", entityId: campaign.id, after: { name: campaign.name } });
  // Phase 9 — mở rộng Automation Engine sang domain Marketing.
  await writeEvent({ organizationId, type: "campaign.created", entityType: "Campaign", entityId: campaign.id, occurredAt: campaign.createdAt });
  return campaign;
}

export async function updateCampaign(
  organizationId: string,
  actorId: string,
  id: string,
  data: {
    name: string;
    description?: string | null;
    status: CampaignStatus;
    projectId?: string | null;
    budget?: number | null;
    startAt?: Date | null;
    endAt?: Date | null;
  }
) {
  const before = await prisma.campaign.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy chiến dịch");
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status,
      projectId: data.projectId || null,
      budget: data.budget ?? null,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "campaign.update",
    entityType: "Campaign",
    entityId: id,
    before: { name: before.name, status: before.status },
    after: { name: updated.name, status: updated.status },
  });
  return updated;
}

export async function deleteCampaign(organizationId: string, actorId: string, id: string) {
  const before = await prisma.campaign.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy chiến dịch");
  await prisma.campaign.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "campaign.delete", entityType: "Campaign", entityId: id, before: { name: before.name } });
}

export async function addChannel(
  organizationId: string,
  campaignId: string,
  data: { type: MarketingChannelType; plannedBudget?: number | null; notes?: string | null }
) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, organizationId } });
  if (!campaign) throw new Error("Không tìm thấy chiến dịch");
  return prisma.campaignChannel.create({
    data: { campaignId, type: data.type, plannedBudget: data.plannedBudget ?? null, notes: data.notes || null },
  });
}

export async function removeChannel(organizationId: string, channelId: string) {
  const channel = await prisma.campaignChannel.findFirst({ where: { id: channelId, campaign: { organizationId } } });
  if (!channel) throw new Error("Không tìm thấy kênh");
  await prisma.campaignChannel.delete({ where: { id: channelId } });
}
