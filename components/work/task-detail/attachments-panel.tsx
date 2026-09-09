"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Link as LinkIcon, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type TaskAttachmentItem = { id: string; label: string; url: string; uploader: { name: string } };

/** Link-only (Phase 2) — xem docs/02-work-hub.md về quyết định chưa nối Vercel Blob. */
export function AttachmentsPanel({
  attachments,
  canEdit,
  onAdd,
  onRemove,
}: {
  attachments: TaskAttachmentItem[];
  canEdit: boolean;
  onAdd: (data: { label: string; url: string }) => Promise<void>;
  onRemove: (attachmentId: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!label.trim() || !url.trim()) return;
    const data = { label: label.trim(), url: url.trim() };
    setLabel("");
    setUrl("");
    startTransition(async () => {
      try {
        await onAdd(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-sm text-primary hover:underline"
            >
              {a.label}
              <span className="sr-only"> (mở ở tab mới)</span>
            </a>
            <span className="text-xs text-muted-foreground">{a.uploader.name}</span>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Xoá đính kèm "${a.label}"`}
                onClick={() => startTransition(async () => onRemove(a.id))}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có đính kèm nào. Hỗ trợ dán link ngoài (Drive/Sheets...) — tải file trực tiếp sẽ mở khi
            cấu hình Vercel Blob.
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <Input placeholder="Tên đính kèm" className="h-8" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input placeholder="URL" className="h-8" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleAdd}>
            <Plus /> Thêm
          </Button>
        </div>
      )}
    </div>
  );
}
