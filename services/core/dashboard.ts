import "server-only";
import { prisma } from "@/lib/db/client";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Chủ nhật
  const diff = day === 0 ? 6 : day - 1; // tuần bắt đầu Thứ 2
  x.setDate(x.getDate() - diff);
  return x;
}

/**
 * Tổng hợp số liệu THẬT từ mọi module cho trang Dashboard — thay cho bản cũ
 * (Phase 1) chỉ đếm users/departments/teams/pendingApprovals và card "Lộ
 * trình triển khai" đã lỗi thời (nói Marketing/CRM/Analytics/AI "sẽ mở khoá
 * dần" trong khi các module này đã xây xong từ lâu).
 *
 * Không tự lọc theo permission ở đây (service tầng dưới không biết RBAC) —
 * page.tsx quyết định card nào hiển thị dựa vào hasPermission() của session,
 * đúng convention của dự án (service trung lập, page/action gác quyền).
 * Mỗi field độc lập, không field nào ném lỗi làm hỏng cả dashboard nếu 1
 * module trống dữ liệu.
 */
export async function getDashboardOverview(organizationId: string, userId: string) {
  const now = new Date();

  const taskListSelect = {
    id: true,
    title: true,
    status: true,
    priority: true,
    dueAt: true,
  } as const;

  const [
    users,
    departments,
    teams,
    pendingApprovals,
    myTasksDueToday,
    myTasksOverdue,
    tasksCompletedThisWeek,
    newLeadsThisMonth,
    openLeads,
    ordersThisMonth,
    revenueThisMonth,
    activeCampaigns,
    activeWarranties,
    warrantiesExpiringSoon,
    todayAttendance,
    myTaskStatusCounts,
    myOverdueList,
    myDueTodayList,
    myUpcomingList,
    recentlyUpdatedTasks,
    activeWorkflowRuns,
    pendingLeaveRequests,
    aiRecommendationsPending,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.department.count({ where: { organizationId } }),
    prisma.team.count({ where: { organizationId } }),
    prisma.approvalStep.count({
      where: { approverId: userId, status: "PENDING", approvalRequest: { organizationId, status: "PENDING" } },
    }),
    prisma.task.count({
      where: {
        organizationId,
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    }),
    prisma.task.count({
      where: { organizationId, assigneeId: userId, status: { notIn: ["DONE", "CANCELLED"] }, dueAt: { lt: startOfDay(now) } },
    }),
    prisma.task.count({
      where: { organizationId, status: "DONE", completedAt: { gte: startOfWeek(now) } },
    }),
    prisma.lead.count({ where: { organizationId, createdAt: { gte: startOfMonth(now) } } }),
    prisma.lead.count({ where: { organizationId, wonAt: null, lostAt: null } }),
    prisma.order.count({
      where: { organizationId, orderDate: { gte: startOfMonth(now) }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    prisma.order.aggregate({
      where: { organizationId, orderDate: { gte: startOfMonth(now) }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.campaign.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.warranty.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.warranty.count({
      where: {
        organizationId,
        status: "ACTIVE",
        warrantyExpiry: { gte: now, lte: new Date(now.getTime() + 30 * 86400000) },
      },
    }),
    prisma.attendanceRecord.findFirst({
      where: { organizationId, userId, occurredAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      orderBy: { occurredAt: "desc" },
      select: { type: true, occurredAt: true },
    }),
    // Nhóm dữ liệu cho donut "Việc của tôi" — tham khảo bố cục Tổng quan của
    // MISA AMIS Công việc (donut + số ở giữa + legend theo trạng thái) —
    // dùng ĐÚNG 5 trạng thái Task thật, không rút gọn/gộp giả.
    prisma.task.groupBy({
      by: ["status"],
      where: { organizationId, assigneeId: userId },
      _count: { _all: true },
    }),
    // 3 nhóm "cần làm" theo mốc thời gian (không phải theo trạng thái) — tham
    // khảo tab Quá hạn/Đến hạn/Sắp đến hạn của MISA, limit 5 dòng mỗi tab vì
    // đây là widget xem nhanh trên Dashboard, xem đủ thì bấm "Xem tất cả" ->
    // /work/my-tasks (đã có bảng đầy đủ + lọc theo trạng thái ở đó).
    prisma.task.findMany({
      where: { organizationId, assigneeId: userId, status: { notIn: ["DONE", "CANCELLED"] }, dueAt: { lt: startOfDay(now) } },
      select: taskListSelect,
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      select: taskListSelect,
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueAt: { gt: endOfDay(now), lte: new Date(now.getTime() + 7 * 86400000) },
      },
      select: taskListSelect,
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    // Thay cho "Công việc được ghim" của MISA — Task ở đây chưa có field pin,
    // dùng "cập nhật gần đây" (updatedAt, toàn tổ chức) làm bản thay thế THẬT
    // thay vì tự thêm 1 field/tính năng ghim mới nằm ngoài phạm vi yêu cầu.
    prisma.task.findMany({
      where: { organizationId },
      select: { id: true, title: true, status: true, updatedAt: true, assignee: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.workflowRun.count({ where: { organizationId, status: { in: ["RUNNING", "AWAITING_APPROVAL"] } } }),
    prisma.leaveRequest.count({ where: { organizationId, approvalRequest: { status: "PENDING" } } }),
    prisma.aiRecommendation.count({ where: { organizationId, status: "PENDING" } }),
  ]);

  const taskStatusCounts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, CANCELLED: 0 };
  for (const row of myTaskStatusCounts) taskStatusCounts[row.status] = row._count._all;

  return {
    org: { users, departments, teams },
    approvals: { pending: pendingApprovals },
    work: { dueToday: myTasksDueToday, overdue: myTasksOverdue, completedThisWeek: tasksCompletedThisWeek },
    crm: { newLeadsThisMonth, openLeads },
    sales: { ordersThisMonth, revenueThisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0) },
    marketing: { activeCampaigns },
    warranty: { active: activeWarranties, expiringSoon: warrantiesExpiringSoon },
    attendance: {
      checkedInToday: !!todayAttendance && todayAttendance.type === "CHECK_IN",
      lastEventAt: todayAttendance?.occurredAt ?? null,
    },
    myTaskStatusCounts: taskStatusCounts,
    myTaskDueLists: { overdue: myOverdueList, dueToday: myDueTodayList, upcoming: myUpcomingList },
    recentlyUpdatedTasks,
    process: { activeRuns: activeWorkflowRuns },
    leave: { pending: pendingLeaveRequests },
    ai: { recommendationsPending: aiRecommendationsPending },
  };
}
