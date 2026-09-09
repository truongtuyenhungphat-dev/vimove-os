import "server-only";
import { prisma } from "@/lib/db/client";

type NotificationType = "SYSTEM" | "TASK" | "APPROVAL" | "MENTION" | "ALERT";

export async function createNotification(data: {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type ?? "SYSTEM",
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
    },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
