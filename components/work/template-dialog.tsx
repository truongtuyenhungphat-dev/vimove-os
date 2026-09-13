"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/work/types";

export function TemplateDialog({
  mode,
  template,
  action,
}: {
  mode: "create" | "edit";
  template?: { id: string; name: string; description: string | null; defaultPriority: TaskPriority; checklistItems: string[] };
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<TaskPriority>(template?.defaultPriority ?? "MEDIUM");
  const [checklist, setChecklist] = useState<string[]>(template?.checklistItems ?? []);

  function handleSubmit(formData: FormData) {
    formData.set("defaultPriority", priority);
    checklist.filter((item) => item.trim()).forEach((item) => formData.append("checklistItems", item));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo mẫu công việc" : "Đã cập nhật mẫu công việc");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setPriority(template?.defaultPriority ?? "MEDIUM");
          setChecklist(template?.checklistItems ?? []);
        }
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo mẫu
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa mẫu "${template?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo mẫu công việc" : "Sửa mẫu công việc"}</DialogTitle>
          <DialogDescription>Mẫu dùng để điền sẵn khi tạo công việc mới (checklist + độ ưu tiên).</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Tên mẫu</Label>
            <Input id="template-name" name="name" defaultValue={template?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-description">Mô tả</Label>
            <Textarea id="template-description" name="description" defaultValue={template?.description ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-priority">Độ ưu tiên mặc định</Label>
            <Select
              items={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger id="template-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Checklist mặc định</Label>
            <div className="flex flex-col gap-1.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={item}
                    onChange={(e) => setChecklist((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá mục checklist ${i + 1}`}
                    onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setChecklist((prev) => [...prev, ""])}
              >
                <Plus /> Thêm mục
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
