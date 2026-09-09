import "server-only";
import { prisma } from "@/lib/db/client";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Tính lại rollup theo ngày từ Event + Order thật (Spend luôn 0 — chưa nối Ads
 * Phase 6). Idempotent qua `@@unique([organizationId, date])` (upsert, không tạo
 * trùng khi chạy lại). Đây là nút "Tính lại" thủ công — chưa có cron tự động. */
export async function recomputeDailyMetrics(organizationId: string, days = 30) {
  const to = startOfDay(new Date());
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const [leadCreatedEvents, leadWonEvents, orders] = await Promise.all([
    prisma.event.findMany({ where: { organizationId, type: "lead.created", occurredAt: { gte: from } } }),
    prisma.event.findMany({ where: { organizationId, type: "lead.won", occurredAt: { gte: from } } }),
    prisma.order.findMany({ where: { organizationId, orderDate: { gte: from }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
  ]);

  const dayKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);
  const byDay = new Map<string, { leads: number; wonLeads: number; orders: number; revenue: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    byDay.set(dayKey(d), { leads: 0, wonLeads: 0, orders: 0, revenue: 0 });
  }
  for (const e of leadCreatedEvents) byDay.get(dayKey(e.occurredAt))!.leads++;
  for (const e of leadWonEvents) byDay.get(dayKey(e.occurredAt))!.wonLeads++;
  for (const o of orders) {
    const bucket = byDay.get(dayKey(o.orderDate));
    if (bucket) {
      bucket.orders++;
      bucket.revenue += Number(o.totalAmount);
    }
  }

  await Promise.all(
    Array.from(byDay.entries()).map(([key, agg]) =>
      prisma.dailyMetric.upsert({
        where: { organizationId_date: { organizationId, date: new Date(key) } },
        update: { leads: agg.leads, wonLeads: agg.wonLeads, orders: agg.orders, revenue: agg.revenue, spend: 0, computedAt: new Date() },
        create: { organizationId, date: new Date(key), leads: agg.leads, wonLeads: agg.wonLeads, orders: agg.orders, revenue: agg.revenue, spend: 0 },
      })
    )
  );

  return byDay.size;
}

export async function listDailyMetrics(organizationId: string, days = 30) {
  const to = startOfDay(new Date());
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const rows = await prisma.dailyMetric.findMany({
    where: { organizationId, date: { gte: from } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ ...r, revenue: Number(r.revenue), spend: Number(r.spend) }));
}
