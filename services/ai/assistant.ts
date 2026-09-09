import "server-only";
import type { Session } from "next-auth";
import { prisma } from "@/lib/db/client";
import { askAssistant, type ChatMessage } from "@/lib/integrations/ai/claude";
import { buildUserContext } from "./context";

export async function listConversations(organizationId: string, userId: string) {
  return prisma.aiConversation.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(organizationId: string, userId: string, id: string) {
  return prisma.aiConversation.findFirst({
    where: { id, organizationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createConversation(organizationId: string, userId: string, title?: string) {
  return prisma.aiConversation.create({ data: { organizationId, userId, title: title || null } });
}

/** Gửi 1 câu hỏi thật tới Claude, dùng context đã lọc theo RBAC của chính session
 * đang hỏi (không phải của conversation owner nếu khác — nhưng conversation luôn
 * thuộc về session hiện tại, xem getConversation). Lưu cả câu hỏi + câu trả lời làm
 * AiMessage thật. */
export async function sendMessage(session: Session, conversationId: string, userMessage: string) {
  const organizationId = session.user.organizationId;
  const conversation = await getConversation(organizationId, session.user.id, conversationId);
  if (!conversation) throw new Error("Không tìm thấy hội thoại");

  await prisma.aiMessage.create({ data: { conversationId, role: "USER", content: userMessage } });

  const systemPrompt = await buildUserContext(session);
  const history: ChatMessage[] = [
    ...conversation.messages.map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content })),
    { role: "user", content: userMessage },
  ];

  const reply = await askAssistant(systemPrompt, history);

  const assistantMessage = await prisma.aiMessage.create({ data: { conversationId, role: "ASSISTANT", content: reply } });
  await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return assistantMessage;
}
