"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ChatMessageItem = { id: string; role: "USER" | "ASSISTANT"; content: string };

/** Chat UI thật — gọi Server Action `onSend` (gọi Claude thật qua
 * services/ai/assistant.ts). Nếu chưa cấu hình ANTHROPIC_API_KEY, action throw lỗi
 * rõ ràng và được hiện qua toast — không giả vờ trả lời. */
export function ChatPanel({
  conversationId,
  messages,
  onSend,
}: {
  conversationId: string;
  messages: ChatMessageItem[];
  onSend: (conversationId: string, message: string) => Promise<string>;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    startTransition(async () => {
      try {
        await onSend(conversationId, text);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex h-[60vh] flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border p-4">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">Đặt câu hỏi về công việc, lead, đơn hàng, chiến dịch... AI chỉ trả lời trong phạm vi quyền của bạn.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
            {m.role === "ASSISTANT" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" aria-hidden="true" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
            {m.role === "USER" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Đang trả lời...
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi..."
          className="min-h-10 flex-1"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button type="button" size="icon" disabled={isPending || !input.trim()} onClick={handleSend} aria-label="Gửi câu hỏi">
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
