"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { createConversation, sendMessage } from "@/services/ai/assistant";

export async function createConversationAction() {
  const session = await requirePermission("ai.read");
  const conversation = await createConversation(session.user.organizationId, session.user.id);
  revalidatePath("/ai/assistant");
  return conversation.id;
}

export async function sendMessageAction(conversationId: string, message: string) {
  const session = await requirePermission("ai.read");
  const parsed = z.string().trim().min(1, "Cần nhập câu hỏi").parse(message);
  const reply = await sendMessage(session, conversationId, parsed);
  revalidatePath("/ai/assistant");
  return reply.content;
}
