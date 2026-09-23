import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { TaskVisibility } from "@/services/tasks/tasks";
import type { DailyReportItemStatus } from "@/app/generated/prisma/client";

/** Sinh các item FIXED còn thiếu cho user+ngày từ RecurringTaskTemplate khớp
 * `roleTitle`. Lazy (gọi mỗi khi user mở trang "Hôm nay"), không cần cron — tự
 * "bắt kịp" nếu có ngày không mở app. `skipDuplicates` + unique([userId,date,
 * templateId]) đảm bảo an toàn khi gọi nhiều lần / race condition. */
export async function ensureTodayFixedItems(organizationId: string, userId: string, roleTitle: string | null, date: string) {
  if (!roleTitle) return;
  const templates = await prisma.recurringTaskTemplate.findMany({
    where: { organizationId, roleTitle, isActive: true },
    orderBy: { position: "asc" },
  });
  if (!templates.length) return;
  await prisma.dailyReportItem.createMany({
    data: templates.map((t) => ({
      organizationId,
      userId,
      date,
      title: t.title,
      priority: t.priority,
      source: "FIXED" as const,
      templateId: t.id,
    })),
    skipDuplicates: true,
  });
}

export async function listDailyReport(organizationId: string, userId: string, date: string) {
  const [items, assignedTasks] = await Promise.all([
    prisma.dailyReportItem.findMany({
      where: { organizationId, userId, date },
      orderBy: [{ source: "asc" }, { createdAt: "asc" }],
    }),
    prisma.task.findMany({
      where: { organizationId, assigneeId: userId, dueAt: { gte: new Date(`${date}T00:00:00Z`), lt: new Date(`${date}T23:59:59.999Z`) } },
      select: { id: true, title: true, status: true, priority: true, dueAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { items, assignedTasks };
}

export async function addAdhocItem(organizationId: string, actorId: string, data: { title: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; date: string }) {
  const title = data.title.trim().slice(0, 300);
  if (!title) throw new Error("Cần nhập tên việc");
  const item = await prisma.dailyReportItem.create({
    data: { organizationId, userId: actorId, date: data.date, title, priority: data.priority ?? "MEDIUM", source: "ADHOC" },
  });
  return item;
}

export async function updateReportItem(organizationId: string, actorId: string, id: string, data: { status?: DailyReportItemStatus; note?: string | null }) {
  const before = await prisma.dailyReportItem.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy việc");
  if (before.userId !== actorId) throw new Error("Chỉ tự cập nhật việc của chính mình");

  const updated = await prisma.dailyReportItem.update({
    where: { id },
    data: { ...(data.status !== undefined ? { status: data.status } : {}), ...(data.note !== undefined ? { note: data.note?.trim().slice(0, 1000) || null } : {}) },
  });
  return updated;
}

export type MonthlyRollupRow = {
  userId: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  cells: Record<string, { done: number; total: number }>;
  totalTasks: number;
  totalDone: number;
  totalPostponed: number;
};

/** Bảng tổng hợp tháng — % hoàn thành mỗi người mỗi ngày làm việc (T2-T7), tính từ
 * DailyReportItem (cố định + tự thêm) CỘNG Task được giao (assigneeId + dueAt rơi
 * đúng ngày đó) — "tổng các công việc" theo đúng yêu cầu, không tách riêng từng loại.
 * Trả plain array (không phải Map) để truyền thẳng qua RSC boundary cho client component. */
export async function listMonthlyRollup(organizationId: string, workingDays: string[], visibility: TaskVisibility): Promise<{ workingDays: string[]; rows: MonthlyRollupRow[] }> {
  const monthStart = new Date(`${workingDays[0]}T00:00:00Z`);
  const monthEnd = new Date(`${workingDays[workingDays.length - 1]}T23:59:59.999Z`);

  const users = await prisma.user.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      ...(visibility.scope === "OWN" ? { id: visibility.userId } : {}),
      ...(visibility.scope === "DEPARTMENT" ? { departmentId: visibility.departmentId ?? "__none__" } : {}),
    },
    select: { id: true, name: true, title: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });
  const userIds = users.map((u) => u.id);
  if (!userIds.length) return { workingDays, rows: [] };

  const [reportItems, tasks] = await Promise.all([
    prisma.dailyReportItem.findMany({
      where: { organizationId, userId: { in: userIds }, date: { in: workingDays } },
      select: { userId: true, date: true, status: true },
    }),
    prisma.task.findMany({
      where: { organizationId, assigneeId: { in: userIds }, dueAt: { gte: monthStart, lte: monthEnd } },
      select: { assigneeId: true, dueAt: true, status: true },
    }),
  ]);

  const rows: MonthlyRollupRow[] = users.map((u) => ({
    userId: u.id,
    name: u.name,
    title: u.title,
    avatarUrl: u.avatarUrl,
    cells: {},
    totalTasks: 0,
    totalDone: 0,
    totalPostponed: 0,
  }));
  const rowByUserId = new Map(rows.map((r) => [r.userId, r]));

  const bump = (userId: string, date: string, done: boolean, postponed: boolean) => {
    const row = rowByUserId.get(userId);
    if (!row) return;
    const cell = row.cells[date] ?? { done: 0, total: 0 };
    cell.total += 1;
    if (done) cell.done += 1;
    row.cells[date] = cell;
    row.totalTasks += 1;
    if (done) row.totalDone += 1;
    if (postponed) row.totalPostponed += 1;
  };

  for (const it of reportItems) bump(it.userId, it.date, it.status === "DONE", it.status === "POSTPONED");
  for (const t of tasks) {
    if (!t.assigneeId || !t.dueAt) continue;
    const date = t.dueAt.toISOString().slice(0, 10);
    if (!workingDays.includes(date)) continue;
    bump(t.assigneeId, date, t.status === "DONE", t.status === "CANCELLED");
  }

  return { workingDays, rows };
}

export async function listDistinctRoleTitles(organizationId: string) {
  const rows = await prisma.user.findMany({
    where: { organizationId, status: "ACTIVE", title: { not: null } },
    select: { title: true },
    distinct: ["title"],
    orderBy: { title: "asc" },
  });
  return rows.map((r) => r.title as string).filter(Boolean);
}

export async function listRecurringTemplates(organizationId: string) {
  return prisma.recurringTaskTemplate.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ roleTitle: "asc" }, { position: "asc" }],
  });
}

export async function createRecurringTemplate(organizationId: string, actorId: string, data: { title: string; roleTitle: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) {
  const last = await prisma.recurringTaskTemplate.findFirst({ where: { organizationId, roleTitle: data.roleTitle }, orderBy: { position: "desc" } });
  const template = await prisma.recurringTaskTemplate.create({
    data: {
      organizationId,
      title: data.title.trim().slice(0, 200),
      roleTitle: data.roleTitle,
      priority: data.priority ?? "MEDIUM",
      position: (last?.position ?? -1) + 1,
      createdById: actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "recurring_task_template.create", entityType: "RecurringTaskTemplate", entityId: template.id, after: { title: template.title, roleTitle: template.roleTitle } });
  return template;
}

export async function updateRecurringTemplate(organizationId: string, actorId: string, id: string, data: { title: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) {
  const before = await prisma.recurringTaskTemplate.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy mẫu việc");
  const updated = await prisma.recurringTaskTemplate.update({
    where: { id },
    data: { title: data.title.trim().slice(0, 200), priority: data.priority ?? before.priority },
  });
  await writeAuditLog({ organizationId, actorId, action: "recurring_task_template.update", entityType: "RecurringTaskTemplate", entityId: id, before: { title: before.title }, after: { title: updated.title } });
  return updated;
}

export async function deleteRecurringTemplate(organizationId: string, actorId: string, id: string) {
  const before = await prisma.recurringTaskTemplate.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy mẫu việc");
  await prisma.recurringTaskTemplate.update({ where: { id }, data: { isActive: false } });
  await writeAuditLog({ organizationId, actorId, action: "recurring_task_template.delete", entityType: "RecurringTaskTemplate", entityId: id, before: { title: before.title } });
}
