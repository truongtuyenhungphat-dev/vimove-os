import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { writeTaskActivity } from "./activity";
import { writeEvent } from "@/services/analytics/events";
import { getWeekRange, computeWorkloadPercent, getWorkloadTone } from "@/lib/work/workload";
import type { TaskStatus, TaskPriority } from "@/lib/work/types";

const taskListInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  tags: { include: { tag: true } },
  _count: { select: { comments: true, checklistItems: true, attachments: true } },
} as const;

export type TaskFilters = {
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  tagId?: string;
  search?: string;
};

/**
 * Phase 10 — Scale: "advanced scoped permissions" cho `tasks.read` (xem
 * lib/auth/rbac.ts#getPermissionScope, lib/permissions/catalog.ts#SCOPABLE_PERMISSIONS).
 * Caller (Server Component/Action) tự đọc scope từ session rồi truyền vào — service
 * layer không tự đọc session (giữ đúng quy ước service chỉ nhận tham số, không phụ
 * thuộc next-auth).
 */
export type TaskVisibility = { scope: "ALL" | "DEPARTMENT" | "OWN"; userId: string; departmentId: string | null };

function buildWhere(organizationId: string, filters: TaskFilters, visibility?: TaskVisibility) {
  return {
    organizationId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
    ...(filters.search ? { title: { contains: filters.search, mode: "insensitive" as const } } : {}),
    ...(visibility?.scope === "OWN" ? { assigneeId: visibility.userId } : {}),
    ...(visibility?.scope === "DEPARTMENT" ? { assignee: { departmentId: visibility.departmentId } } : {}),
  };
}

export async function listMyTasks(organizationId: string, userId: string) {
  return prisma.task.findMany({
    where: { organizationId, assigneeId: userId },
    include: taskListInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function listAllTasks(organizationId: string, filters: TaskFilters = {}, visibility?: TaskVisibility) {
  return prisma.task.findMany({
    where: buildWhere(organizationId, filters, visibility),
    include: taskListInclude,
    orderBy: [{ createdAt: "desc" }],
  });
}

/** Danh sách dùng cho Kanban/Calendar/Timeline/Gantt — cần startAt/dueAt/position đầy đủ. */
export async function listSchedulableTasks(organizationId: string, filters: TaskFilters = {}, visibility?: TaskVisibility) {
  return prisma.task.findMany({
    where: buildWhere(organizationId, filters, visibility),
    include: taskListInclude,
    orderBy: [{ position: "asc" }],
  });
}

/** Danh sách cho Gantt — cần thêm dependsOn để vẽ mũi tên + validate khi kéo. */
export async function listGanttTasks(organizationId: string, filters: TaskFilters = {}, visibility?: TaskVisibility) {
  return prisma.task.findMany({
    where: buildWhere(organizationId, filters, visibility),
    include: {
      ...taskListInclude,
      dependsOn: { select: { dependsOnTaskId: true } },
    },
    orderBy: [{ startAt: "asc" }],
  });
}

export async function getKanbanBoard(organizationId: string, filters: TaskFilters = {}, visibility?: TaskVisibility) {
  const tasks = await listSchedulableTasks(organizationId, filters, visibility);
  const board: Record<TaskStatus, typeof tasks> = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
    CANCELLED: [],
  };
  for (const task of tasks) board[task.status as TaskStatus].push(task);
  return board;
}

export async function getTask(organizationId: string, id: string) {
  return prisma.task.findFirst({
    where: { id, organizationId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
      creator: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      checklistItems: { orderBy: { position: "asc" } },
      comments: {
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      watchers: { include: { user: { select: { id: true, name: true } } } },
      timeLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { loggedAt: "desc" },
      },
      tags: { include: { tag: true } },
      dependsOn: {
        include: { dependsOnTask: { select: { id: true, title: true, status: true, dueAt: true } } },
      },
      dependents: {
        include: { task: { select: { id: true, title: true, status: true, startAt: true } } },
      },
      activities: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Xác nhận task thuộc đúng organization trước khi thao tác trên sub-resource (checklist,
 * comment, attachment...) — các bảng con không có organizationId riêng, chỉ scope qua task. */
export async function assertTaskInOrganization(organizationId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId }, select: { id: true } });
  if (!task) throw new Error("Không tìm thấy công việc");
  return task;
}

export async function createTask(
  organizationId: string,
  actorId: string,
  data: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    assigneeId?: string | null;
    teamId?: string | null;
    projectId?: string | null;
    startAt?: Date | null;
    dueAt?: Date | null;
    estimateHours?: number | null;
    checklistItems?: string[];
    tagIds?: string[];
  }
) {
  const last = await prisma.task.findFirst({
    where: { organizationId, status: "TODO" },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      organizationId,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      teamId: data.teamId || null,
      projectId: data.projectId || null,
      creatorId: actorId,
      startAt: data.startAt ?? null,
      dueAt: data.dueAt ?? null,
      estimateHours: data.estimateHours ?? null,
      position: (last?.position ?? -1) + 1,
      checklistItems: data.checklistItems?.length
        ? { create: data.checklistItems.map((title, i) => ({ title, position: i })) }
        : undefined,
      tags: data.tagIds?.length ? { create: data.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  await writeTaskActivity({ taskId: task.id, actorId, type: "CREATED" });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    after: { title: task.title, assigneeId: task.assigneeId },
  });
  // Phase 9 — cho phép Automation Engine tự chạy workflow khi có task mới (mở rộng
  // sang domain Work, xem services/process/automation.ts).
  await writeEvent({ organizationId, type: "task.created", entityType: "Task", entityId: task.id, occurredAt: task.createdAt });
  return task;
}

export async function updateTask(
  organizationId: string,
  actorId: string,
  id: string,
  data: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    assigneeId?: string | null;
    teamId?: string | null;
    projectId?: string | null;
    startAt?: Date | null;
    dueAt?: Date | null;
    estimateHours?: number | null;
  }
) {
  const before = await prisma.task.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy công việc");

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      teamId: data.teamId || null,
      projectId: data.projectId || null,
      startAt: data.startAt ?? null,
      dueAt: data.dueAt ?? null,
      estimateHours: data.estimateHours ?? null,
    },
  });

  const activityType =
    before.assigneeId !== updated.assigneeId
      ? "ASSIGNED"
      : before.priority !== updated.priority
        ? "PRIORITY_CHANGED"
        : "UPDATED";
  await writeTaskActivity({
    taskId: id,
    actorId,
    type: activityType,
    payload: {
      before: { title: before.title, assigneeId: before.assigneeId, priority: before.priority },
      after: { title: updated.title, assigneeId: updated.assigneeId, priority: updated.priority },
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "task.update",
    entityType: "Task",
    entityId: id,
    before: { title: before.title, assigneeId: before.assigneeId, priority: before.priority },
    after: { title: updated.title, assigneeId: updated.assigneeId, priority: updated.priority },
  });
  return updated;
}

export async function deleteTask(organizationId: string, actorId: string, id: string) {
  const before = await prisma.task.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy công việc");
  await prisma.task.delete({ where: { id } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "task.delete",
    entityType: "Task",
    entityId: id,
    before: { title: before.title },
  });
}

/** Kanban drop: đổi status (nếu có) + xếp lại position trong cột đích, dồn lại cột nguồn. */
export async function moveTaskStatus(
  organizationId: string,
  actorId: string,
  taskId: string,
  data: { status: TaskStatus; targetIndex: number }
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } });
  if (!task) throw new Error("Không tìm thấy công việc");
  const fromStatus = task.status as TaskStatus;
  const statusChanged = fromStatus !== data.status;

  await prisma.$transaction(async (tx) => {
    const targetColumn = await tx.task.findMany({
      where: { organizationId, status: data.status, id: { not: taskId } },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const ids = targetColumn.map((t) => t.id);
    const insertAt = Math.max(0, Math.min(data.targetIndex, ids.length));
    ids.splice(insertAt, 0, taskId);

    await Promise.all(
      ids.map((id, index) =>
        tx.task.update({
          where: { id },
          data: {
            position: index,
            ...(id === taskId && statusChanged
              ? { status: data.status, completedAt: data.status === "DONE" ? new Date() : null }
              : {}),
          },
        })
      )
    );

    if (statusChanged) {
      const sourceColumn = await tx.task.findMany({
        where: { organizationId, status: fromStatus, id: { not: taskId } },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      await Promise.all(
        sourceColumn.map((t, index) => tx.task.update({ where: { id: t.id }, data: { position: index } }))
      );
    }
  });

  if (statusChanged) {
    await writeTaskActivity({
      taskId,
      actorId,
      type: "STATUS_CHANGED",
      payload: { from: fromStatus, to: data.status },
    });
    await writeAuditLog({
      organizationId,
      actorId,
      action: "task.status.change",
      entityType: "Task",
      entityId: taskId,
      before: { status: fromStatus },
      after: { status: data.status },
    });
  }
}

/**
 * Dời lịch (Calendar/Timeline/Gantt). `enforceDependencies=true` (Gantt) validate cả 2
 * chiều: task này không được bắt đầu trước khi task nó phụ thuộc hoàn thành, và không
 * được dời hạn hoàn thành trễ hơn ngày bắt đầu của task đang phụ thuộc vào nó — không
 * bao giờ tin client, luôn re-check ở server (theo Next.js Server Actions security guide).
 */
export async function rescheduleTask(
  organizationId: string,
  actorId: string,
  taskId: string,
  data: { startAt?: Date | null; dueAt?: Date | null },
  options: { enforceDependencies: boolean } = { enforceDependencies: false }
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId },
    include: {
      dependsOn: { include: { dependsOnTask: { select: { dueAt: true, title: true } } } },
      dependents: { include: { task: { select: { startAt: true, title: true } } } },
    },
  });
  if (!task) throw new Error("Không tìm thấy công việc");

  // undefined = giữ nguyên giá trị hiện tại (vd Calendar chỉ dời dueAt, không đụng startAt).
  const nextStartAt = data.startAt !== undefined ? data.startAt : task.startAt;
  const nextDueAt = data.dueAt !== undefined ? data.dueAt : task.dueAt;

  if (options.enforceDependencies) {
    if (nextStartAt) {
      const predecessorDueDates = task.dependsOn
        .map((d) => d.dependsOnTask.dueAt)
        .filter((d): d is Date => !!d);
      if (predecessorDueDates.length > 0) {
        const earliestAllowed = new Date(Math.max(...predecessorDueDates.map((d) => d.getTime())));
        if (nextStartAt < earliestAllowed) {
          throw new Error(
            `Không thể bắt đầu trước ${earliestAllowed.toLocaleDateString("vi-VN")} — vi phạm phụ thuộc vào công việc trước đó`
          );
        }
      }
    }
    if (nextDueAt) {
      for (const dependent of task.dependents) {
        if (dependent.task.startAt && dependent.task.startAt < nextDueAt) {
          throw new Error(
            `Không thể dời hạn hoàn thành sau ${nextDueAt.toLocaleDateString("vi-VN")} — công việc "${dependent.task.title}" đã lên lịch bắt đầu trước đó`
          );
        }
      }
    }
  }

  const before = { startAt: task.startAt, dueAt: task.dueAt };
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { startAt: nextStartAt, dueAt: nextDueAt },
  });
  await writeTaskActivity({
    taskId,
    actorId,
    type: "RESCHEDULED",
    payload: { before, after: { startAt: nextStartAt, dueAt: nextDueAt } },
  });
  return updated;
}

export async function getWorkloadData(organizationId: string, weekDate: Date) {
  const { start, end } = getWeekRange(weekDate);
  const tasks = await prisma.task.findMany({
    where: { organizationId, assigneeId: { not: null }, status: { notIn: ["DONE", "CANCELLED"] } },
    select: {
      assigneeId: true,
      estimateHours: true,
      startAt: true,
      dueAt: true,
      assignee: {
        select: {
          id: true,
          name: true,
          teamMembers: { select: { team: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  const overlapping = tasks.filter((t) => {
    if (!t.startAt && !t.dueAt) return false;
    const effStart = t.startAt ?? t.dueAt!;
    const effEnd = t.dueAt ?? t.startAt!;
    return effStart <= end && effEnd >= start;
  });

  const byUser = new Map<string, { userId: string; name: string; hours: number; teams: { id: string; name: string }[] }>();
  for (const t of overlapping) {
    if (!t.assigneeId || !t.assignee) continue;
    const entry = byUser.get(t.assigneeId) ?? {
      userId: t.assigneeId,
      name: t.assignee.name,
      hours: 0,
      teams: t.assignee.teamMembers.map((tm) => tm.team),
    };
    entry.hours += t.estimateHours ?? 0;
    byUser.set(t.assigneeId, entry);
  }

  const users = Array.from(byUser.values())
    .map((u) => {
      const percent = computeWorkloadPercent(u.hours);
      return { ...u, percent, tone: getWorkloadTone(percent) };
    })
    .sort((a, b) => b.percent - a.percent);

  // Rollup theo team = trung bình % của các thành viên CÓ việc trong tuần (member rảnh
  // việc không kéo trung bình xuống — tránh đánh giá sai đội đang quá tải).
  const teamMap = new Map<string, { teamId: string; name: string; percents: number[] }>();
  for (const u of users) {
    for (const team of u.teams) {
      const entry = teamMap.get(team.id) ?? { teamId: team.id, name: team.name, percents: [] };
      entry.percents.push(u.percent);
      teamMap.set(team.id, entry);
    }
  }
  const teams = Array.from(teamMap.values())
    .map((t) => {
      const percent = Math.round(t.percents.reduce((a, b) => a + b, 0) / t.percents.length);
      return { teamId: t.teamId, name: t.name, percent, tone: getWorkloadTone(percent), memberCount: t.percents.length };
    })
    .sort((a, b) => b.percent - a.percent);

  return { weekStart: start, weekEnd: end, users, teams };
}
