import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { summarizeInsight } from "@/lib/integrations/ai/claude";

const BOTTLENECK_THRESHOLD = 3;
const PAUSE_CAMPAIGN_MIN_DAYS = 14;
const BUDGET_REALLOCATION_RATIO = 1.5; // chiến dịch kém phải tốn gấp >1.5 lần / lead mới đề xuất
const BUDGET_REDUCTION_PERCENT = 0.2; // đề xuất giảm 20% ngân sách chiến dịch kém hiệu quả

/**
 * Sinh insight bằng heuristic thật trên dữ liệu tổ chức — KHÔNG cần Claude API
 * (`summarizeInsight` chỉ thêm mô tả tự nhiên hơn nếu có cấu hình, có fallback an
 * toàn nếu chưa có — số liệu evidence luôn thật bất kể AI có cấu hình hay không).
 * Idempotent theo cách đơn giản: mỗi lần chạy tạo insight mới (không upsert như Data
 * Quality Hub) vì insight mang tính thời điểm — nhưng recommendation cho cùng 1
 * entity chỉ tạo 1 lần khi đang PENDING (không tạo trùng khi user chưa xử lý xong).
 */
export async function generateInsights(organizationId: string) {
  const created: string[] = [];

  // 1. WORK_BOTTLENECK — nhân sự có nhiều việc quá hạn nhất.
  const overdueTasks = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: { organizationId, status: { notIn: ["DONE", "CANCELLED"] }, dueAt: { lt: new Date() }, assigneeId: { not: null } },
    _count: true,
  });
  for (const row of overdueTasks) {
    if (row._count >= BOTTLENECK_THRESHOLD && row.assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: row.assigneeId }, select: { name: true } });
      const evidence = { assigneeId: row.assigneeId, assigneeName: user?.name, overdueCount: row._count };
      const title = `${user?.name ?? "Một nhân sự"} đang có ${row._count} công việc quá hạn`;
      const description =
        (await summarizeInsight(title, evidence)) ??
        `Phát hiện ${row._count} công việc quá hạn đang được giao cho ${user?.name ?? "nhân sự này"} — có thể là điểm nghẽn cần Manager can thiệp phân bổ lại.`;
      const insight = await prisma.aiInsight.create({
        data: { organizationId, type: "WORK_BOTTLENECK", severity: row._count >= BOTTLENECK_THRESHOLD * 2 ? "HIGH" : "MEDIUM", title, description, evidence },
      });
      created.push(insight.id);
    }
  }

  // 2. PROJECT_HEALTH — dự án có milestone quá hạn chưa xong.
  const projects = await prisma.project.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: { milestones: { where: { status: "PENDING", dueAt: { lt: new Date() } } } },
  });
  for (const project of projects) {
    if (project.milestones.length > 0) {
      const evidence = { projectId: project.id, projectName: project.name, overdueMilestones: project.milestones.map((m) => m.name) };
      const title = `Dự án "${project.name}" có ${project.milestones.length} milestone trễ hạn`;
      const description =
        (await summarizeInsight(title, evidence)) ??
        `Dự án đang có ${project.milestones.length} milestone quá hạn chưa hoàn thành: ${project.milestones.map((m) => m.name).join(", ")}.`;
      const insight = await prisma.aiInsight.create({
        data: { organizationId, type: "PROJECT_HEALTH", severity: "MEDIUM", title, description, evidence },
      });
      created.push(insight.id);
    }
  }

  // 3. MARKETING_ANOMALY — chiến dịch ACTIVE chạy lâu mà chưa có lead nào → đề xuất
  // tạm dừng (action nhạy cảm THẬT, phải qua duyệt mới thực thi — đúng §3 rule 11).
  const activeCampaigns = await prisma.campaign.findMany({
    where: { organizationId, status: "ACTIVE", startAt: { not: null } },
    include: { leads: { select: { id: true } } },
  });
  for (const campaign of activeCampaigns) {
    const daysSinceStart = campaign.startAt ? (Date.now() - campaign.startAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
    if (daysSinceStart >= PAUSE_CAMPAIGN_MIN_DAYS && campaign.leads.length === 0) {
      const evidence = { campaignId: campaign.id, campaignName: campaign.name, daysRunning: Math.floor(daysSinceStart), leadCount: 0 };
      const title = `Chiến dịch "${campaign.name}" chạy ${Math.floor(daysSinceStart)} ngày chưa có lead nào`;
      const description =
        (await summarizeInsight(title, evidence)) ??
        `Chiến dịch đã chạy ${Math.floor(daysSinceStart)} ngày (≥ ${PAUSE_CAMPAIGN_MIN_DAYS} ngày ngưỡng cảnh báo) nhưng chưa ghi nhận lead nào quy về — có thể đang lãng phí ngân sách.`;
      const insight = await prisma.aiInsight.create({
        data: { organizationId, type: "MARKETING_ANOMALY", severity: "HIGH", title, description, evidence },
      });
      created.push(insight.id);

      const existingPending = await prisma.aiRecommendation.findFirst({
        where: { organizationId, targetEntityType: "Campaign", targetEntityId: campaign.id, status: "PENDING" },
      });
      if (!existingPending) {
        await prisma.aiRecommendation.create({
          data: {
            organizationId,
            insightId: insight.id,
            title: `Tạm dừng chiến dịch "${campaign.name}"`,
            description: `${description} Đề xuất tạm dừng để tránh tiếp tục chi ngân sách không hiệu quả — cần bạn duyệt trước khi hệ thống thực thi.`,
            actionType: "PAUSE_CAMPAIGN",
            targetEntityType: "Campaign",
            targetEntityId: campaign.id,
          },
        });
      }
    }
  }

  // 4. BUDGET_OPTIMIZATION (Phase 9) — so sánh hiệu quả chi phí/lead giữa các chiến
  // dịch ACTIVE có ngân sách VÀ đã có ít nhất 1 lead (không so sánh được hiệu quả nếu
  // chưa có lead nào). Dùng `budget` (ngân sách dự kiến) làm proxy chi phí — CHƯA có
  // Spend thật (Phase 6) nên đây là ước lượng, ghi rõ trong mô tả, không giả vờ là
  // số liệu chi tiêu thật.
  const budgetedCampaigns = await prisma.campaign.findMany({
    where: { organizationId, status: "ACTIVE", budget: { not: null } },
    include: { leads: { select: { id: true } } },
  });
  const withEfficiency = budgetedCampaigns
    .filter((c) => c.leads.length > 0)
    .map((c) => ({ id: c.id, name: c.name, budget: Number(c.budget), leadCount: c.leads.length, costPerLead: Number(c.budget) / c.leads.length }));

  if (withEfficiency.length >= 2) {
    const sorted = [...withEfficiency].sort((a, b) => a.costPerLead - b.costPerLead);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (worst.id !== best.id && worst.costPerLead > best.costPerLead * BUDGET_REALLOCATION_RATIO) {
      const reduceAmount = Math.round(worst.budget * BUDGET_REDUCTION_PERCENT);
      const newBudget = worst.budget - reduceAmount;
      const evidence = {
        worstCampaignId: worst.id,
        worstCampaignName: worst.name,
        worstCostPerLead: Math.round(worst.costPerLead),
        bestCampaignId: best.id,
        bestCampaignName: best.name,
        bestCostPerLead: Math.round(best.costPerLead),
        proposedReduction: reduceAmount,
        proposedNewBudget: newBudget,
      };
      const title = `Chiến dịch "${worst.name}" tốn ngân sách/lead cao hơn nhiều so với "${best.name}"`;
      const description =
        (await summarizeInsight(title, evidence)) ??
        `Ước lượng theo ngân sách dự kiến (chưa có Spend thật): "${worst.name}" tốn ~${Math.round(worst.costPerLead).toLocaleString("vi-VN")}đ/lead, trong khi "${best.name}" chỉ ~${Math.round(best.costPerLead).toLocaleString("vi-VN")}đ/lead — chênh lệch ≥ ${BUDGET_REALLOCATION_RATIO}x. Đề xuất giảm ${Math.round(BUDGET_REDUCTION_PERCENT * 100)}% ngân sách của "${worst.name}" (${reduceAmount.toLocaleString("vi-VN")}đ) để phân bổ lại cho chiến dịch hiệu quả hơn.`;
      const insight = await prisma.aiInsight.create({
        data: { organizationId, type: "BUDGET_OPTIMIZATION", severity: "MEDIUM", title, description, evidence },
      });
      created.push(insight.id);

      const existingPending = await prisma.aiRecommendation.findFirst({
        where: { organizationId, targetEntityType: "Campaign", targetEntityId: worst.id, status: "PENDING", actionType: "ADJUST_BUDGET" },
      });
      if (!existingPending) {
        await prisma.aiRecommendation.create({
          data: {
            organizationId,
            insightId: insight.id,
            title: `Giảm ngân sách chiến dịch "${worst.name}" xuống ${newBudget.toLocaleString("vi-VN")}đ`,
            description: `${description} Cần bạn duyệt trước khi hệ thống đổi ngân sách.`,
            actionType: "ADJUST_BUDGET",
            targetEntityType: "Campaign",
            targetEntityId: worst.id,
            payload: { newBudget },
          },
        });
      }
    }
  }

  await writeAuditLog({ organizationId, actorId: null, action: "ai.insights_generated", entityType: "Organization", entityId: organizationId, after: { count: created.length } });
  return created.length;
}

export async function listInsights(organizationId: string) {
  return prisma.aiInsight.findMany({ where: { organizationId }, orderBy: { detectedAt: "desc" }, take: 50 });
}
