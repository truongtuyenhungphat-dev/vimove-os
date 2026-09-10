/**
 * Dọn dữ liệu nghiệp vụ mẫu (demo/seed), GIỮ NGUYÊN khung tổ chức thật: Organization,
 * Department, Team/TeamMember, Role/Permission/RolePermission/UserRole, User, Tag
 * (danh mục nhãn dùng lại được, không phải dữ liệu nghiệp vụ).
 *
 * Xoá toàn bộ: Work Hub (task...), Project & Process (dự án/workflow/duyệt), CRM &
 * Sales (lead/khách hàng/đơn hàng/sản phẩm/kênh bán/pipeline), Marketing (chiến
 * dịch/content/social/landing page/email), Ads, Analytics (event/report/data
 * quality), AI (conversation/insight/recommendation/action), Chấm công (địa điểm/ca/
 * chấm công/nghỉ phép), Notification/AuditLog/ErrorLog.
 *
 * Thứ tự xoá: LÁ TRƯỚC, GỐC SAU (an toàn với FK bất kể cấu hình cascade cụ thể của
 * từng bảng).
 *
 * Chạy: npx tsx scripts/reset-demo-data.ts
 * (dùng đúng DATABASE_URL/DATABASE_URL_UNPOOLED đang set trong môi trường — xem
 * NHAT-KY-KIEN-TRUC.md §4 để lấy connection string production)
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) {
    console.log("Không tìm thấy organization 'vimove' — không có gì để dọn.");
    return;
  }
  const organizationId = organization.id;
  console.log(`Dọn dữ liệu nghiệp vụ mẫu cho organization: ${organization.name} (${organizationId})`);

  // ---- Work Hub ----
  await prisma.taskComment.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskChecklistItem.deleteMany({});
  await prisma.taskWatcher.deleteMany({});
  await prisma.taskActivity.deleteMany({});
  await prisma.taskTimeLog.deleteMany({});
  await prisma.taskTag.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({ where: { organizationId } });
  await prisma.taskTemplate.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Work Hub (task, checklist, comment, attachment, dependency, watcher, activity, time log, mẫu task).");

  // ---- Chấm công (Phase 11) — xoá LeaveRequest trước ApprovalRequest ----
  await prisma.leaveRequest.deleteMany({ where: { organizationId } });
  await prisma.qrCheckinToken.deleteMany({ where: { organizationId } });
  await prisma.attendanceRecord.deleteMany({ where: { organizationId } });
  await prisma.shiftAssignment.deleteMany({ where: { organizationId } });
  await prisma.shift.deleteMany({ where: { organizationId } });
  await prisma.attendanceLocation.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Chấm công (đơn nghỉ phép, QR token, chấm công, xếp ca, ca, địa điểm).");

  // ---- Project & Process ----
  await prisma.workflowRunStep.deleteMany({});
  await prisma.workflowRun.deleteMany({ where: { organizationId } });
  await prisma.workflowVersion.deleteMany({});
  await prisma.workflow.deleteMany({ where: { organizationId } });
  await prisma.approvalStep.deleteMany({});
  await prisma.approvalRequest.deleteMany({ where: { organizationId } });
  await prisma.projectFile.deleteMany({});
  await prisma.projectMilestone.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({ where: { organizationId } });
  await prisma.projectTemplate.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Project & Process (dự án, workflow, run, đơn duyệt).");

  // ---- Marketing (xoá trước CRM Lead vì Lead.campaignId, và trước Campaign) ----
  await prisma.formSubmission.deleteMany({});
  await prisma.landingForm.deleteMany({});
  await prisma.socialPost.deleteMany({});
  await prisma.socialAccount.deleteMany({ where: { organizationId } });
  await prisma.landingPage.deleteMany({ where: { organizationId } });
  await prisma.contentAsset.deleteMany({});
  await prisma.content.deleteMany({ where: { organizationId } });
  await prisma.emailCampaign.deleteMany({ where: { organizationId } });
  await prisma.campaignChannel.deleteMany({});

  // ---- CRM & Sales (Lead phải xoá trước Campaign vì Lead.campaignId) ----
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({ where: { organizationId } });
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({ where: { organizationId } });
  await prisma.customer.deleteMany({ where: { organizationId } });
  await prisma.product.deleteMany({ where: { organizationId } });
  await prisma.salesChannel.deleteMany({ where: { organizationId } });
  await prisma.pipelineStage.deleteMany({});
  await prisma.pipeline.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: CRM & Sales (lead, khách hàng, đơn hàng, sản phẩm, kênh bán, pipeline).");

  await prisma.campaign.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Marketing (chiến dịch, content, social, landing page, email).");

  // ---- Ads ----
  await prisma.adMetricDaily.deleteMany({});
  await prisma.adCreative.deleteMany({});
  await prisma.ad.deleteMany({});
  await prisma.adAdSet.deleteMany({});
  await prisma.adCampaign.deleteMany({});
  await prisma.adAccount.deleteMany({});
  await prisma.adConnection.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Ads Integration.");

  // ---- Analytics ----
  await prisma.dataQualityIssue.deleteMany({ where: { organizationId } });
  await prisma.reportWidget.deleteMany({});
  await prisma.report.deleteMany({ where: { organizationId } });
  await prisma.dailyMetric.deleteMany({ where: { organizationId } });
  await prisma.attributionEvent.deleteMany({});
  await prisma.attributionTouchpoint.deleteMany({});
  await prisma.event.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: Analytics (event, attribution, daily metric, report, data quality).");

  // ---- AI Command Center ----
  await prisma.aiActionLog.deleteMany({});
  await prisma.aiAction.deleteMany({});
  await prisma.aiRecommendation.deleteMany({ where: { organizationId } });
  await prisma.aiInsight.deleteMany({ where: { organizationId } });
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({ where: { organizationId } });
  console.log("Đã xoá: AI Command Center (conversation, insight, recommendation, action).");

  // ---- Nhật ký hệ thống (bắt đầu lại từ đầu cho môi trường thật) ----
  // Notification không có organizationId (chỉ scope theo userId) — xoá hết vì DB
  // này chỉ phục vụ 1 organization. ErrorLog.organizationId nullable (lỗi có thể xảy
  // ra trước khi biết tổ chức, vd ở middleware) — xoá hết để không sót bản ghi null.
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({ where: { organizationId } });
  await prisma.errorLog.deleteMany({});
  console.log("Đã xoá: Notification, AuditLog, ErrorLog.");

  console.log("\nGIỮ NGUYÊN: Organization, 4 phòng ban, 1 nhóm (Đội Marketing), vai trò +");
  console.log("quyền hạn, 3 tài khoản (admin/marketing/sales@vimove.vn), 3 nhãn (Tag).");
  console.log("Dọn dữ liệu demo hoàn tất.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
