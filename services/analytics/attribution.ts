import "server-only";
import { prisma } from "@/lib/db/client";

export type UtmParams = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

/** Ghi 1 lượt truy cập landing page — gọi từ route công khai `/lp/[slug]` (không
 * kiểm tra RBAC, đúng bản chất trang công khai). `visitorId` là cookie ẩn danh. */
export async function recordTouchpoint(organizationId: string, visitorId: string, landingPageId: string | null, utm: UtmParams) {
  await prisma.attributionTouchpoint.create({
    data: {
      organizationId,
      visitorId,
      landingPageId,
      utmSource: utm.utmSource || null,
      utmMedium: utm.utmMedium || null,
      utmCampaign: utm.utmCampaign || null,
      utmContent: utm.utmContent || null,
      utmTerm: utm.utmTerm || null,
    },
  });
}

/** Ghi 1 sự kiện chuyển đổi (vd submit form) và gán first-touch/last-touch dựa trên
 * lịch sử touchpoint thật của visitorId đó — idempotent qua idempotencyKey (thường =
 * id của FormSubmission) nên gọi lại (network retry) không tính trùng. */
export async function recordConversionEvent(params: {
  organizationId: string;
  visitorId: string;
  type: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
}) {
  const touchpoints = await prisma.attributionTouchpoint.findMany({
    where: { organizationId: params.organizationId, visitorId: params.visitorId },
    orderBy: { occurredAt: "asc" },
  });
  const first = touchpoints[0] ?? null;
  const last = touchpoints[touchpoints.length - 1] ?? null;

  await prisma.attributionEvent.upsert({
    where: { idempotencyKey: params.idempotencyKey },
    update: {},
    create: {
      organizationId: params.organizationId,
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      idempotencyKey: params.idempotencyKey,
      firstTouchpointId: first?.id ?? null,
      lastTouchpointId: last?.id ?? null,
    },
  });
}

/** Tổng hợp số lượt chuyển đổi theo nguồn UTM (first-touch) — dùng cho Marketing
 * dashboard. Chỉ tính trên dữ liệu attribution thật (touchpoint có UTM), không suy
 * diễn cho lead tạo tay trong CRM. */
export async function listAttributionSummary(organizationId: string) {
  const events = await prisma.attributionEvent.findMany({
    where: { organizationId },
    include: { firstTouchpoint: { select: { utmSource: true, utmCampaign: true } } },
  });

  const bySource = new Map<string, number>();
  for (const e of events) {
    const key = e.firstTouchpoint?.utmSource || "(không rõ nguồn)";
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }
  return Array.from(bySource.entries())
    .map(([source, conversions]) => ({ source, conversions }))
    .sort((a, b) => b.conversions - a.conversions);
}
