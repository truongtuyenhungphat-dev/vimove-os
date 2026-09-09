import "server-only";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@/app/generated/prisma/client";

/** Ghi 1 event nghiệp vụ — idempotent qua `idempotencyKey` (mặc định
 * `${type}:${entityId}`). Gọi từ service layer các phase trước (lead/order) khi có
 * hành động đáng ghi nhận cho DailyMetric rollup (Phase 7) VÀ để tự động kích hoạt
 * Workflow có `triggerEventType` khớp (Automation Engine, Phase 9).
 *
 * Idempotency của automation: chỉ event THẬT SỰ MỚI (chưa từng tồn tại
 * `idempotencyKey` này) mới kích hoạt workflow — gọi lại `writeEvent` với cùng
 * idempotencyKey (vd network retry ở tầng gọi) chỉ update payload, KHÔNG chạy lại
 * workflow lần 2. Dùng `create` trước (bắt lỗi unique constraint P2002) thay vì
 * `upsert` để phân biệt được "mới tạo" và "đã tồn tại".
 */
export async function writeEvent(params: {
  organizationId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
  idempotencyKey?: string;
}) {
  const idempotencyKey = params.idempotencyKey ?? `${params.type}:${params.entityId}`;
  const occurredAt = params.occurredAt ?? new Date();

  let isNew = true;
  try {
    await prisma.event.create({
      data: {
        organizationId: params.organizationId,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        payload: params.payload as object | undefined,
        occurredAt,
        idempotencyKey,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      isNew = false;
      await prisma.event.update({ where: { idempotencyKey }, data: { payload: params.payload as object | undefined, occurredAt } });
    } else {
      throw err;
    }
  }

  if (isNew) {
    // Lazy import để tránh vòng phụ thuộc module (workflow-engine không import
    // ngược lại events.ts).
    const { triggerWorkflowsForEvent } = await import("@/services/process/automation");
    await triggerWorkflowsForEvent(params.organizationId, params.type, { entityType: params.entityType, entityId: params.entityId, ...params.payload });
  }
}
