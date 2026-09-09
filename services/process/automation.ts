import "server-only";
import { prisma } from "@/lib/db/client";
import { startWorkflowRun } from "./workflow-engine";
import { logger } from "@/lib/observability/logger";

/**
 * Automation Engine (Phase 9) — kích hoạt mọi Workflow đã publish, đang active, có
 * `triggerEventType` khớp đúng `eventType` vừa xảy ra trong cùng organization. Gọi
 * từ `services/analytics/events.ts#writeEvent` — CHỈ khi event đó thật sự mới tạo
 * (đảm bảo idempotent, xem ghi chú ở đó).
 *
 * Đây là cách VIMOVE OS đưa Trigger/Condition/Action (§19) áp dụng cho cả Work
 * (lead.won không có ở Work nhưng task tương lai có thể thêm)/Marketing/CRM: bất kỳ
 * domain nào gọi `writeEvent()` với đúng `type` sẽ tự động chạy được workflow, không
 * cần sửa gì thêm ở automation engine khi thêm domain mới — chỉ cần domain đó gọi
 * `writeEvent()` (đã có sẵn cho lead.created/lead.won/order.created từ Phase 7).
 *
 * `startWorkflowRun` chạy đồng bộ trong request hiện tại (không có job queue durable
 * — xem docs/03-project-process.md) nên với event có nhiều workflow khớp, chạy tuần
 * tự từng cái; lỗi ở 1 workflow không chặn các workflow khác (bắt lỗi riêng từng
 * cái, ghi log qua chính WorkflowRun.status = FAILED có sẵn).
 */
export async function triggerWorkflowsForEvent(organizationId: string, eventType: string, payload: Record<string, unknown>) {
  const workflows = await prisma.workflow.findMany({
    where: { organizationId, triggerEventType: eventType, isActive: true, currentVersion: { publishedAt: { not: null } } },
    select: { id: true, createdById: true },
  });

  for (const workflow of workflows) {
    try {
      // Không có "actor" con người cho automation — dùng chính người tạo workflow
      // làm actorId ghi nhận trong AuditLog/WorkflowRun (đúng quy ước hiện có: mọi
      // WorkflowRun đều cần 1 createdById, không thêm cột nullable riêng chỉ để
      // phân biệt "hệ thống tự chạy" — payload.triggerType đã đủ để biết là tự động).
      await startWorkflowRun(organizationId, workflow.createdById, workflow.id, { ...payload, triggerType: "event", eventType });
    } catch (err) {
      // Lỗi khi bắt đầu 1 workflow (vd chưa publish kịp giữa lúc query và lúc chạy)
      // không được làm hỏng luồng nghiệp vụ chính (tạo lead/order...) đang gọi
      // writeEvent() — automation là phụ, không phải điều kiện tiên quyết. Nhưng vẫn
      // phải có dấu vết thật (Phase 10) — trước đây lỗi này biến mất hoàn toàn.
      logger.warn("Automation trigger thất bại", { organizationId, workflowId: workflow.id, eventType, error: err instanceof Error ? err.message : String(err) });
    }
  }
}
