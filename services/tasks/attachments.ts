import "server-only";
import { prisma } from "@/lib/db/client";
import { writeTaskActivity } from "./activity";

// Link-only ở Phase 2 (name + URL ngoài) — chưa nối Vercel Blob (BLOB_READ_WRITE_TOKEN
// chưa cấu hình). Upload file thật là follow-up khi có token, xem docs/02-work-hub.md.
export async function addAttachmentLink(taskId: string, uploaderId: string, data: { label: string; url: string }) {
  const attachment = await prisma.taskAttachment.create({
    data: { taskId, uploaderId, label: data.label, url: data.url },
  });
  await writeTaskActivity({ taskId, actorId: uploaderId, type: "ATTACHMENT_ADDED", payload: { label: data.label } });
  return attachment;
}

export async function removeAttachment(taskId: string, actorId: string, attachmentId: string) {
  const attachment = await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  await writeTaskActivity({ taskId, actorId, type: "ATTACHMENT_REMOVED", payload: { label: attachment.label } });
}
