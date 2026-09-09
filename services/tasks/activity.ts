import "server-only";
import { prisma } from "@/lib/db/client";
import type { TaskActivityType } from "@/lib/work/types";

/**
 * Timeline riêng cho từng Task (tab "Hoạt động" ở Task Detail) — khác AuditLog
 * toàn hệ thống ở admin (services/core/audit.ts), tuy song song ghi cả hai cho
 * các hành động chính (tasks.ts gọi writeAuditLog riêng).
 */
export async function writeTaskActivity(params: {
  taskId: string;
  actorId?: string | null;
  type: TaskActivityType;
  payload?: unknown;
}) {
  await prisma.taskActivity.create({
    data: {
      taskId: params.taskId,
      actorId: params.actorId ?? null,
      type: params.type,
      payload: params.payload === undefined ? undefined : (params.payload as object),
    },
  });
}

export async function listTaskActivity(taskId: string) {
  return prisma.taskActivity.findMany({
    where: { taskId },
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
