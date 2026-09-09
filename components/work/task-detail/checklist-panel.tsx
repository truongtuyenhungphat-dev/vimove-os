"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChecklistItem = { id: string; title: string; isDone: boolean };

export function ChecklistPanel({
  items,
  canEdit,
  onAdd,
  onToggle,
  onRemove,
}: {
  items: ChecklistItem[];
  canEdit: boolean;
  onAdd: (title: string) => Promise<void>;
  onToggle: (itemId: string, isDone: boolean) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const done = items.filter((i) => i.isDone).length;

  function handleAdd() {
    if (!title.trim()) return;
    const value = title.trim();
    setTitle("");
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
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {done}/{items.length} hoàn thành
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <Checkbox
              checked={item.isDone}
              disabled={!canEdit}
              aria-label={item.title}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  try {
                    await onToggle(item.id, checked === true);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
                  }
                })
              }
            />
            <span className={cn("flex-1 text-sm", item.isDone && "text-muted-foreground line-through")}>
              {item.title}
            </span>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Xoá mục "${item.title}"`}
                onClick={() => startTransition(async () => onRemove(item.id))}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Chưa có mục checklist nào.</p>}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Thêm mục..."
            className="h-8"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" disabled={isPending} aria-label="Thêm mục checklist" onClick={handleAdd}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
