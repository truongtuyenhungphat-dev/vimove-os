import "server-only";
import { prisma } from "@/lib/db/client";
import { hasPermission } from "@/lib/auth/rbac";
import type { Session } from "next-auth";

/**
 * Dựng system prompt context CHỈ gồm dữ liệu mà session hiện tại được phép xem —
 * đúng nghiệm thu Phase 8 "AI trả lời đúng phạm vi quyền của user hỏi (không lộ dữ
 * liệu tổ chức khác/phòng ban khác nếu không có quyền)". Mỗi khối dữ liệu chỉ được
 * thêm vào nếu session có permission tương ứng — không có "chế độ admin ẩn" nào bỏ
 * qua kiểm tra này.
 */
export async function buildUserContext(session: Session): Promise<string> {
  const organizationId = session.user.organizationId;
  const userId = session.user.id;
  const sections: string[] = [`Người dùng hỏi: ${session.user.name} (vai trò/quyền của họ giới hạn dữ liệu bên dưới).`];

  if (hasPermission(session, "tasks.read")) {
    const [myTasks, overdue] = await Promise.all([
      prisma.task.count({ where: { organizationId, assigneeId: userId, status: { notIn: ["DONE", "CANCELLED"] } } }),
      prisma.task.count({ where: { organizationId, assigneeId: userId, status: { notIn: ["DONE", "CANCELLED"] }, dueAt: { lt: new Date() } } }),
    ]);
    sections.push(`Công việc: đang có ${myTasks} việc chưa xong được giao cho người dùng này, trong đó ${overdue} việc quá hạn.`);
  }

  if (hasPermission(session, "leads.read")) {
    const [openLeads, wonLeads] = await Promise.all([
      prisma.lead.count({ where: { organizationId, stage: { type: "OPEN" } } }),
      prisma.lead.count({ where: { organizationId, stage: { type: "WON" } } }),
    ]);
    sections.push(`CRM: ${openLeads} lead đang mở, ${wonLeads} lead đã thắng (toàn tổ chức — người dùng có quyền leads.read).`);
  }

  if (hasPermission(session, "orders.read")) {
    const orders = await prisma.order.findMany({ where: { organizationId, status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { totalAmount: true } });
    const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    sections.push(`Sales: ${orders.length} đơn hàng hợp lệ, tổng doanh thu ${revenue.toLocaleString("vi-VN")}đ.`);
  }

  if (hasPermission(session, "campaigns.read")) {
    const campaigns = await prisma.campaign.findMany({ where: { organizationId, status: "ACTIVE" }, select: { name: true, budget: true } });
    sections.push(`Marketing: ${campaigns.length} chiến dịch đang chạy — ${campaigns.map((c) => c.name).join(", ") || "(không có)"}.`);
  }

  if (sections.length === 1) {
    sections.push("Người dùng này chưa có quyền xem module dữ liệu nghiệp vụ nào — chỉ trả lời câu hỏi chung, không suy đoán số liệu.");
  }

  return [
    "Bạn là AI Work Assistant của VIMOVE OS. CHỈ được dùng đúng dữ liệu trong phần 'Ngữ cảnh' dưới đây — đây là dữ liệu đã được lọc theo đúng quyền hạn (RBAC) của người hỏi. TUYỆT ĐỐI không bịa số liệu, không suy đoán dữ liệu ngoài phạm vi được cung cấp, không đề cập tới module/phòng ban mà người dùng không có trong ngữ cảnh.",
    "Ngữ cảnh:",
    ...sections,
  ].join("\n");
}
