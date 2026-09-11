import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "./audit";

const SALT_ROUNDS = 12;

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    include: {
      department: { select: { id: true, name: true } },
      userRoles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(organizationId: string, id: string) {
  return prisma.user.findFirst({
    where: { id, organizationId },
    include: {
      department: { select: { id: true, name: true } },
      userRoles: { include: { role: true } },
    },
  });
}

export async function createUser(
  organizationId: string,
  actorId: string,
  data: { email: string; name: string; password: string; departmentId?: string | null; title?: string | null; roleIds: string[] }
) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      organizationId,
      email: data.email,
      name: data.name,
      passwordHash,
      departmentId: data.departmentId || null,
      title: data.title || null,
      userRoles: { create: data.roleIds.map((roleId) => ({ roleId })) },
    },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    after: { email: user.email, name: user.name, roleIds: data.roleIds },
  });
  return user;
}

export async function updateUser(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; departmentId?: string | null; title?: string | null; roleIds: string[] }
) {
  const before = await getUser(organizationId, id);
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { name: data.name, departmentId: data.departmentId || null, title: data.title || null },
    });
    await tx.userRole.deleteMany({ where: { userId: id } });
    await tx.userRole.createMany({
      data: data.roleIds.map((roleId) => ({ userId: id, roleId })),
      skipDuplicates: true,
    });
    return updated;
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "user.update",
    entityType: "User",
    entityId: id,
    before,
    after: { name: data.name, roleIds: data.roleIds },
  });
  return user;
}

export async function setUserStatus(
  organizationId: string,
  actorId: string,
  id: string,
  status: "ACTIVE" | "INACTIVE"
) {
  const before = await getUser(organizationId, id);
  const user = await prisma.user.update({ where: { id }, data: { status } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: status === "ACTIVE" ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: id,
    before,
    after: user,
  });
  return user;
}

export async function updateOwnProfile(
  organizationId: string,
  userId: string,
  data: { name: string; title?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, title: data.title || null },
  });
  await writeAuditLog({
    organizationId,
    actorId: userId,
    action: "user.profile.update",
    entityType: "User",
    entityId: userId,
    after: data,
  });
  return user;
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    throw new Error("Mật khẩu hiện tại không đúng");
  }
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await writeAuditLog({
    organizationId: user.organizationId,
    actorId: userId,
    action: "user.password.change",
    entityType: "User",
    entityId: userId,
  });
}

/** Email là unique toàn hệ thống (schema `User.email @unique`), không chỉ trong 1 organization. */
export async function emailExists(email: string, excludeId?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) return false;
  return existing.id !== excludeId;
}

// Rất nhiều bảng dùng onDelete: Cascade khi trỏ về User (người tạo/tác giả — vd
// Task.creator, Campaign.createdBy, WorkflowRun.createdBy...) — xoá thẳng User sẽ
// âm thầm xoá theo TOÀN BỘ dữ liệu họ từng tạo, không có lỗi/cảnh báo gì từ Postgres.
// Vì vậy `deleteUser()` chỉ cho xoá vĩnh viễn khi tài khoản CHƯA tạo dữ liệu gì —
// còn lại phải dùng `setUserStatus(..., "INACTIVE")` (Vô hiệu hoá) để giữ lịch sử.
async function countOwnedRecords(userId: string) {
  const [
    createdTasks,
    taskComments,
    taskAttachments,
    ownedProjects,
    projectFiles,
    createdWorkflows,
    workflowRuns,
    requestedApprovals,
    approvalSteps,
    createdCampaigns,
    createdContents,
    createdSocialPosts,
    createdLandingPages,
    createdEmailCampaigns,
    connectedAdConnections,
    createdReports,
    aiConversations,
    approvedAiActions,
    attendanceRecords,
    leaveRequests,
    createdAttendanceLocations,
    createdShifts,
  ] = await Promise.all([
    prisma.task.count({ where: { creatorId: userId } }),
    prisma.taskComment.count({ where: { authorId: userId } }),
    prisma.taskAttachment.count({ where: { uploaderId: userId } }),
    prisma.project.count({ where: { ownerId: userId } }),
    prisma.projectFile.count({ where: { uploaderId: userId } }),
    prisma.workflow.count({ where: { createdById: userId } }),
    prisma.workflowRun.count({ where: { createdById: userId } }),
    prisma.approvalRequest.count({ where: { requestedById: userId } }),
    prisma.approvalStep.count({ where: { approverId: userId } }),
    prisma.campaign.count({ where: { createdById: userId } }),
    prisma.content.count({ where: { createdById: userId } }),
    prisma.socialPost.count({ where: { createdById: userId } }),
    prisma.landingPage.count({ where: { createdById: userId } }),
    prisma.emailCampaign.count({ where: { createdById: userId } }),
    prisma.adConnection.count({ where: { connectedById: userId } }),
    prisma.report.count({ where: { createdById: userId } }),
    prisma.aiConversation.count({ where: { userId } }),
    prisma.aiAction.count({ where: { approvedById: userId } }),
    prisma.attendanceRecord.count({ where: { userId } }),
    prisma.leaveRequest.count({ where: { userId } }),
    prisma.attendanceLocation.count({ where: { createdById: userId } }),
    prisma.shift.count({ where: { createdById: userId } }),
  ]);
  return (
    createdTasks +
    taskComments +
    taskAttachments +
    ownedProjects +
    projectFiles +
    createdWorkflows +
    workflowRuns +
    requestedApprovals +
    approvalSteps +
    createdCampaigns +
    createdContents +
    createdSocialPosts +
    createdLandingPages +
    createdEmailCampaigns +
    connectedAdConnections +
    createdReports +
    aiConversations +
    approvedAiActions +
    attendanceRecords +
    leaveRequests +
    createdAttendanceLocations +
    createdShifts
  );
}

export async function deleteUser(organizationId: string, actorId: string, id: string) {
  const before = await getUser(organizationId, id);
  if (!before) throw new Error("Không tìm thấy người dùng");

  const ownedCount = await countOwnedRecords(id);
  if (ownedCount > 0) {
    throw new Error(
      `Không thể xoá vĩnh viễn — tài khoản này đã tạo ${ownedCount} dữ liệu trong hệ thống ` +
        "(công việc/dự án/chiến dịch/chấm công...). Dùng \"Vô hiệu hoá\" để giữ lại lịch sử."
    );
  }

  await prisma.user.delete({ where: { id } });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "user.delete",
    entityType: "User",
    entityId: id,
    before,
  });
}
