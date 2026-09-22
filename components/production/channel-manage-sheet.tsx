"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings2, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { PRODUCTION_TASK_TYPES } from "@/lib/production/types";

type ChannelData = { id: string; name: string; taskTypes: string[] };

export function ChannelManageSheet({
  channels,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}: {
  channels: ChannelData[];
  canManage: boolean;
  onCreate: (name: string, taskTypes: string[]) => Promise<void>;
  onUpdate: (id: string, name: string, taskTypes: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 /> Quản lý kênh
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Kênh sản xuất</SheetTitle>
          <SheetDescription>Mỗi kênh chọn những đầu việc cần theo dõi (Viết KB / Quay / Edit / Post).</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {channels.length === 0 && <p className="text-sm text-muted-foreground">Chưa có kênh nào.</p>}
          {channels.map((c) => (
            <ChannelRow key={c.id} channel={c} canManage={canManage} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          {canManage && <NewChannelForm onCreate={onCreate} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChannelRow({
  channel,
  canManage,
  onUpdate,
  onDelete,
}: {
  channel: ChannelData;
  canManage: boolean;
  onUpdate: (id: string, name: string, taskTypes: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function toggleTask(task: string, checked: boolean) {
    const next = checked ? [...channel.taskTypes, task] : channel.taskTypes.filter((t) => t !== task);
    if (next.length === 0) {
      toast.error("Kênh cần ít nhất 1 đầu việc");
      return;
    }
    startTransition(async () => {
      try {
        await onUpdate(channel.id, channel.name, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function renameIfChanged(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === channel.name) return;
    startTransition(async () => {
      try {
        await onUpdate(channel.id, trimmed, channel.taskTypes);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Input
          defaultValue={channel.name}
          disabled={!canManage || isPending}
          className="h-8 flex-1"
          onBlur={(e) => renameIfChanged(e.currentTarget.value)}
        />
        {canManage && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá kênh "${channel.name}"`}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await onDelete(channel.id);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
                }
              })
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {PRODUCTION_TASK_TYPES.map((t) => (
          <Label key={t} className="flex items-center gap-1.5 text-xs font-normal">
            <Checkbox
              checked={channel.taskTypes.includes(t)}
              disabled={!canManage || isPending}
              onCheckedChange={(checked) => toggleTask(t, checked === true)}
            />
            {t}
          </Label>
        ))}
      </div>
    </div>
  );
}

function NewChannelForm({ onCreate }: { onCreate: (name: string, taskTypes: string[]) => Promise<void> }) {
  const [name, setName] = useState("");
  const [tasks, setTasks] = useState<string[]>([...PRODUCTION_TASK_TYPES]);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (tasks.length === 0) {
      toast.error("Chọn ít nhất 1 đầu việc");
      return;
    }
    startTransition(async () => {
      try {
        await onCreate(trimmed, tasks);
        setName("");
        setTasks([...PRODUCTION_TASK_TYPES]);
        toast.success("Đã thêm kênh");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <Input placeholder="Tên kênh mới…" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      <div className="flex flex-wrap gap-3">
        {PRODUCTION_TASK_TYPES.map((t) => (
          <Label key={t} className="flex items-center gap-1.5 text-xs font-normal">
            <Checkbox
              checked={tasks.includes(t)}
              onCheckedChange={(checked) => setTasks((prev) => (checked === true ? [...prev, t] : prev.filter((x) => x !== t)))}
            />
            {t}
          </Label>
        ))}
      </div>
      <Button size="sm" onClick={submit} disabled={isPending || !name.trim()}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Thêm kênh
      </Button>
    </div>
  );
}
