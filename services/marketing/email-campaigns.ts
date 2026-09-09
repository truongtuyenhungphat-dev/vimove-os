import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { EmailCampaignStatus } from "@/lib/marketing/types";

export async function listEmailCampaigns(organizationId: string) {
  return prisma.emailCampaign.findMany({
    where: { organizationId },
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmailCampaign(
  organizationId: string,
  actorId: string,
  data: { name: string; subject: string; campaignId?: string | null; scheduledAt?: Date | null }
) {
  const email = await prisma.emailCampaign.create({
    data: {
      organizationId,
      name: data.name,
      subject: data.subject,
      campaignId: data.campaignId || null,
      scheduledAt: data.scheduledAt ?? null,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      createdById: actorId,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "email_campaign.create", entityType: "EmailCampaign", entityId: email.id, after: { name: email.name } });
  return email;
}

/** "Gửi" chỉ đánh dấu trạng thái — CHƯA gọi provider email thật (§ ghi chú
 * schema.prisma). recipientCount nhập thủ công để phản ánh quy mô dự kiến. */
export async function updateEmailCampaignStatus(organizationId: string, actorId: string, id: string, status: EmailCampaignStatus, recipientCount?: number) {
  const before = await prisma.emailCampaign.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy email campaign");
  const updated = await prisma.emailCampaign.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" ? new Date() : before.sentAt,
      recipientCount: recipientCount ?? before.recipientCount,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "email_campaign.status_change", entityType: "EmailCampaign", entityId: id, before: { status: before.status }, after: { status } });
  return updated;
}

export async function deleteEmailCampaign(organizationId: string, actorId: string, id: string) {
  const before = await prisma.emailCampaign.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy email campaign");
  await prisma.emailCampaign.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "email_campaign.delete", entityType: "EmailCampaign", entityId: id, before: { name: before.name } });
}
