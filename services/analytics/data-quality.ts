import "server-only";
import { prisma } from "@/lib/db/client";

const STALE_ACCOUNT_DAYS = 2;
const METRIC_MISMATCH_MIN_DAYS_SINCE_START = 7;

/** Quét toàn bộ tổ chức, phát hiện + upsert `DataQualityIssue` cho từng case thật
 * (không tạo issue giả). Case đang mở nhưng không còn tái hiện khi quét lại sẽ tự
 * chuyển RESOLVED — đúng nghiệm thu "tự phát hiện" + không để issue cũ trôi nổi mãi.
 * 5 detector, đúng danh sách roadmap Phase 7:
 * 1. SYNC_FAILURE — AdConnection đang ở trạng thái ERROR.
 * 2. STALE_ACCOUNT — AdConnection CONNECTED nhưng lastSyncedAt quá cũ.
 * 3. MISSING_UTM — LandingPage đã publish nhưng chưa có lượt truy cập gắn UTM nào.
 * 4. DUPLICATE_EVENT — nhiều FormSubmission cùng dữ liệu, cùng form, sát giờ nhau.
 * 5. METRIC_MISMATCH — Campaign ACTIVE có ngân sách nhưng Spend thật vẫn = 0 sau
 *    nhiều ngày (dữ liệu không khớp kỳ vọng — case này chắc chắn có ít nhất 1 kết
 *    quả với dữ liệu seed sẵn, vì seed-campaign-1 ACTIVE + có budget + Spend luôn 0
 *    do chưa nối Ads Phase 6).
 */
export async function runDataQualityScan(organizationId: string) {
  const foundKeys = new Set<string>();

  async function report(type: "SYNC_FAILURE" | "MISSING_UTM" | "DUPLICATE_EVENT" | "STALE_ACCOUNT" | "METRIC_MISMATCH", entityType: string, entityId: string, description: string, severity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM") {
    foundKeys.add(`${type}:${entityType}:${entityId}`);
    await prisma.dataQualityIssue.upsert({
      where: { organizationId_type_entityType_entityId: { organizationId, type, entityType, entityId } },
      update: { description, severity, detectedAt: new Date(), status: "OPEN", resolvedAt: null },
      create: { organizationId, type, entityType, entityId, description, severity },
    });
  }

  // 1 + 2. Ad connections
  const connections = await prisma.adConnection.findMany({ where: { organizationId } });
  for (const c of connections) {
    if (c.status === "ERROR") {
      await report("SYNC_FAILURE", "AdConnection", c.id, `Kết nối ${c.platform} lỗi đồng bộ: ${c.lastSyncError ?? "không rõ lý do"}`, "HIGH");
    }
    if (c.status === "CONNECTED" && c.lastSyncedAt) {
      const daysSince = (Date.now() - c.lastSyncedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > STALE_ACCOUNT_DAYS) {
        await report("STALE_ACCOUNT", "AdConnection", c.id, `Kết nối ${c.platform} chưa đồng bộ ${Math.floor(daysSince)} ngày`, "MEDIUM");
      }
    }
  }

  // 3. Landing pages published nhưng chưa có touchpoint UTM nào — Phase 10: gộp thành
  // 1 groupBy thay vì 1 count() riêng cho từng landing page (N+1 cũ: 1 + P query cho
  // P landing page đã publish).
  const publishedPages = await prisma.landingPage.findMany({ where: { organizationId, status: "PUBLISHED" } });
  const touchpointCounts =
    publishedPages.length > 0
      ? await prisma.attributionTouchpoint.groupBy({
          by: ["landingPageId"],
          where: { organizationId, landingPageId: { in: publishedPages.map((p) => p.id) } },
          _count: true,
        })
      : [];
  const pagesWithTouchpoints = new Set(touchpointCounts.map((t) => t.landingPageId).filter((id): id is string => !!id));
  for (const page of publishedPages) {
    if (!pagesWithTouchpoints.has(page.id)) {
      await report("MISSING_UTM", "LandingPage", page.id, `Landing page "${page.name}" chưa có lượt truy cập gắn UTM nào`, "LOW");
    }
  }

  // 4. Duplicate form submissions (cùng data, cùng form, cách nhau < 5 phút) — Phase
  // 10: lấy TOÀN BỘ submission của mọi form trong 1 query, group theo landingFormId
  // trong bộ nhớ, thay vì 1 query riêng cho từng form (N+1 cũ: 1 + F query cho F form).
  const forms = await prisma.landingForm.findMany({ where: { landingPage: { organizationId } }, select: { id: true } });
  const allSubmissions =
    forms.length > 0
      ? await prisma.formSubmission.findMany({
          where: { landingFormId: { in: forms.map((f) => f.id) } },
          orderBy: { submittedAt: "asc" },
        })
      : [];
  const submissionsByForm = new Map<string, typeof allSubmissions>();
  for (const s of allSubmissions) {
    const arr = submissionsByForm.get(s.landingFormId) ?? [];
    arr.push(s);
    submissionsByForm.set(s.landingFormId, arr);
  }
  for (const submissions of submissionsByForm.values()) {
    for (let i = 1; i < submissions.length; i++) {
      const prev = submissions[i - 1];
      const cur = submissions[i];
      const sameData = JSON.stringify(prev.data) === JSON.stringify(cur.data);
      const closeInTime = cur.submittedAt.getTime() - prev.submittedAt.getTime() < 5 * 60 * 1000;
      if (sameData && closeInTime) {
        await report("DUPLICATE_EVENT", "FormSubmission", cur.id, `Submission trùng nội dung với submission trước đó chỉ ${Math.round((cur.submittedAt.getTime() - prev.submittedAt.getTime()) / 1000)}s`, "LOW");
      }
    }
  }

  // 5. Campaign ACTIVE có ngân sách nhưng CHƯA có Spend thật nào trong toàn tổ chức
  // sau nhiều ngày chạy. Lưu ý: `Campaign` (marketing, Phase 5) và `AdCampaign` (nền
  // tảng quảng cáo, Phase 6) là 2 thực thể riêng, chưa có liên kết trực tiếp — nên
  // đây là so sánh ở mức tổ chức (có kế hoạch chi tiêu marketing vs có ghi nhận chi
  // tiêu ads thật chưa), không phải đối chiếu spend đúng của từng chiến dịch.
  const activeCampaignsWithBudget = await prisma.campaign.findMany({ where: { organizationId, status: "ACTIVE", budget: { not: null } } });
  if (activeCampaignsWithBudget.length > 0) {
    const spendAgg = await prisma.adMetricDaily.aggregate({
      where: { adCampaign: { adAccount: { connection: { organizationId } } } },
      _sum: { spend: true },
    });
    const totalSpend = Number(spendAgg._sum.spend ?? 0);
    if (totalSpend === 0) {
      for (const c of activeCampaignsWithBudget) {
        const daysSinceStart = c.startAt ? (Date.now() - c.startAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
        if (daysSinceStart >= METRIC_MISMATCH_MIN_DAYS_SINCE_START) {
          await report(
            "METRIC_MISMATCH",
            "Campaign",
            c.id,
            `Chiến dịch "${c.name}" đang chạy ${Math.floor(daysSinceStart)} ngày với ngân sách ${Number(c.budget)} nhưng tổ chức chưa ghi nhận Spend thật nào từ Ads (chưa nối Phase 6)`,
            "MEDIUM"
          );
        }
      }
    }
  }

  // Đóng các issue cũ không còn tái hiện ở lần quét này.
  const openIssues = await prisma.dataQualityIssue.findMany({ where: { organizationId, status: "OPEN" } });
  const toResolve = openIssues.filter((i) => !foundKeys.has(`${i.type}:${i.entityType}:${i.entityId}`));
  if (toResolve.length > 0) {
    await prisma.dataQualityIssue.updateMany({
      where: { id: { in: toResolve.map((i) => i.id) } },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  return { foundCount: foundKeys.size, resolvedCount: toResolve.length };
}

export async function listDataQualityIssues(organizationId: string) {
  return prisma.dataQualityIssue.findMany({ where: { organizationId }, orderBy: [{ status: "asc" }, { detectedAt: "desc" }] });
}

export async function resolveIssue(organizationId: string, id: string, status: "RESOLVED" | "IGNORED") {
  const issue = await prisma.dataQualityIssue.findFirst({ where: { id, organizationId } });
  if (!issue) throw new Error("Không tìm thấy issue");
  await prisma.dataQualityIssue.update({ where: { id }, data: { status, resolvedAt: new Date() } });
}
