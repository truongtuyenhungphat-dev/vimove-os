"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MilestoneItem = { id: string; name: string; dueAt: string | null; status: "PENDING" | "DONE" };

export function MilestonesPanel({
  milestones,
  canEdit,
  onAdd,
  onToggle,
  onRemove,
}: {
  milestones: MilestoneItem[];
  canEdit: boolean;
  onAdd: (name: string, dueAt: string | null) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim()) return;
    const value = name.trim();
    const due = dueAt || null;
    setName("");
    setDueAt("");
    startTransition(async () => {
      try {
        await onAdd(value, due);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <Checkbox
              checked={m.status === "DONE"}
              disabled={!canEdit}
              aria-label={m.name}
              onCheckedChange={(checked) => startTransition(async () => onToggle(m.id, checked === true))}
            />
            <span className={cn("flex-1 text-sm", m.status === "DONE" && "text-muted-foreground line-through")}>{m.name}</span>
            {m.dueAt && <span className="text-xs text-muted-foreground">{format(new Date(m.dueAt), "dd/MM/yyyy")}</span>}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Xoá milestone "${m.name}"`}
                onClick={() => startTransition(async () => onRemove(m.id))}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {milestones.length === 0 && <p className="text-sm text-muted-foreground">Chưa có milestone nào.</p>}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1.5">
          <Input placeholder="Tên milestone..." className="h-8" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="date" className="h-8 w-40" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <Button type="button" size="sm" variant="outline" disabled={isPending} aria-label="Thêm milestone" onClick={handleAdd}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
