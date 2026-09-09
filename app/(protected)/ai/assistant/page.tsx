import type { Metadata } from "next";
import Link from "next/link";
import { Bot } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { listConversations, getConversation } from "@/services/ai/assistant";
import { isAiConfigured } from "@/lib/integrations/ai/claude";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChatPanel } from "@/components/ai/chat-panel";
import { NewConversationButton } from "@/components/ai/new-conversation-button";
import { sendMessageAction, createConversationAction } from "./actions";

export const metadata: Metadata = { title: "AI Work Assistant — VIMOVE OS" };

export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await requirePermission("ai.read");
  const { c: conversationId } = await searchParams;
  const conversations = await listConversations(session.user.organizationId, session.user.id);
  const activeConversation = conversationId ? await getConversation(session.user.organizationId, session.user.id, conversationId) : null;

  return (
    <>
      <PageHeader title="AI Work Assistant" description="Trả lời dựa trên đúng dữ liệu bạn được phép xem (RBAC)" actions={<NewConversationButton action={createConversationAction} />} />

      {!isAiConfigured() && (
        <Alert variant="destructive">
          <AlertTitle>Chưa cấu hình ANTHROPIC_API_KEY</AlertTitle>
          <AlertDescription>Gửi câu hỏi sẽ báo lỗi rõ ràng cho tới khi biến môi trường này được thiết lập — xem docs/08-ai-command-center.md.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col gap-1 pt-6">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hội thoại nào.</p>
            ) : (
              conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/ai/assistant?c=${c.id}`}
                  className={`rounded-md px-2 py-1.5 text-sm hover:bg-accent ${c.id === conversationId ? "bg-accent font-medium" : ""}`}
                >
                  {c.title || `Hội thoại ${new Date(c.createdAt).toLocaleDateString("vi-VN")}`}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            {activeConversation ? (
              <ChatPanel
                conversationId={activeConversation.id}
                messages={activeConversation.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
                onSend={sendMessageAction}
              />
            ) : (
              <EmptyState
                icon={Bot}
                title="Chọn hoặc tạo hội thoại mới"
                description={conversations.length === 0 ? 'Bấm "Hội thoại mới" ở trên để bắt đầu hỏi AI về công việc, lead, đơn hàng, chiến dịch của bạn.' : "Chọn 1 hội thoại ở danh sách bên trái."}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
