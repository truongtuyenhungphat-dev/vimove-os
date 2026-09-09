"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatusBadge } from "../task-badges";
import type { TaskStatus } from "@/lib/work/types";

export type DependencyItem = { dependencyId: string; task: { id: string; title: string; status: TaskStatus } };

export function DependenciesPanel({
  dependsOn,
  dependents,
  candidateTasks,
  canEdit,
  onAdd,
  onRemove,
}: {
  dependsOn: DependencyItem[];
  dependents: DependencyItem[];
  candidateTasks: { id: string; title: string }[];
  canEdit: boolean;
  onAdd: (dependsOnTaskId: string) => Promise<void>;
  onRemove: (dependencyId: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      try {
        await onAdd(selected);
        setSelected("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Phụ thuộc vào (phải xong trước)</p>
        <div className="flex flex-col gap-1.5">
          {dependsOn.map((d) => (
            <div
              key={d.dependencyId}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
            >
              <span className="flex-1 truncate text-sm">{d.task.title}</span>
              <TaskStatusBadge status={d.task.status} />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Gỡ phụ thuộc vào "${d.task.title}"`}
                  onClick={() => startTransition(async () => onRemove(d.dependencyId))}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}
          {dependsOn.length === 0 && <p className="text-sm text-muted-foreground">Không có.</p>}
        </div>
      </div>

      {canEdit && candidateTasks.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Select value={selected} onValueChange={(v) => setSelected(String(v))}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Chọn công việc..." />
            </SelectTrigger>
            <SelectContent>
              {candidateTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" disabled={isPending || !selected} onClick={handleAdd}>
            <Plus /> Thêm
          </Button>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Công việc phụ thuộc vào việc này</p>
        <div className="flex flex-col gap-1.5">
          {dependents.map((d) => (
            <div
              key={d.dependencyId}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
            >
              <span className="flex-1 truncate text-sm">{d.task.title}</span>
              <TaskStatusBadge status={d.task.status} />
            </div>
          ))}
          {dependents.length === 0 && <p className="text-sm text-muted-foreground">Không có.</p>}
        </div>
      </div>
    </div>
  );
}
