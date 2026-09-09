"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type TaskCommentItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  author: { id: string; name: string };
};

export function CommentsPanel({
  comments,
  currentUserId,
  canDeleteAny,
  onAdd,
  onDelete,
}: {
  comments: TaskCommentItem[];
  currentUserId: string;
  canDeleteAny: boolean;
  onAdd: (body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!body.trim()) return;
    const value = body.trim();
    setBody("");
    startTransition(async () => {
      try {
        await onAdd(value);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>{c.author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg border border-border p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{c.author.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: vi })}
                  </p>
                  {(canDeleteAny || c.author.id === currentUserId) && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Xoá bình luận của ${c.author.name}`}
                      onClick={() => startTransition(async () => onDelete(c.id))}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Textarea placeholder="Viết bình luận..." value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="button" size="sm" className="self-end" disabled={isPending} onClick={handleAdd}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
