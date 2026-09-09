"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type TimeLogItem = {
  id: string;
  minutes: number;
  note: string | null;
  loggedAt: Date | string;
  user: { id: string; name: string };
};

export function TimeLogPanel({
  logs,
  currentUserId,
  canDeleteAny,
  onAdd,
  onRemove,
}: {
  logs: TimeLogItem[];
  currentUserId: string;
  canDeleteAny: boolean;
  onAdd: (data: { minutes: number; note: string | null }) => Promise<void>;
  onRemove: (logId: string) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);

  function handleAdd() {
    const value = Number(minutes);
    if (!value || value <= 0) return;
    setMinutes("");
    setNote("");
    startTransition(async () => {
      try {
        await onAdd({ minutes: value, note: note.trim() || null });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Tổng: {(totalMinutes / 60).toFixed(1)} giờ ({totalMinutes} phút)
      </p>
      <div className="flex flex-col gap-1.5">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
            <span className="font-medium">{l.user.name}</span>
            <span className="text-muted-foreground">{(l.minutes / 60).toFixed(1)}h</span>
            {l.note && <span className="flex-1 truncate text-muted-foreground">— {l.note}</span>}
            <span className="text-xs text-muted-foreground">{format(new Date(l.loggedAt), "dd/MM")}</span>
            {(canDeleteAny || l.user.id === currentUserId) && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Xoá log thời gian của ${l.user.name}`}
                onClick={() => startTransition(async () => onRemove(l.id))}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-muted-foreground">Chưa ghi nhận thời gian nào.</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Phút"
          type="number"
          min={1}
          className="h-8 w-24"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <Input
          placeholder="Ghi chú (tuỳ chọn)"
          className="h-8 flex-1"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleAdd}>
          Ghi
        </Button>
      </div>
    </div>
  );
}
