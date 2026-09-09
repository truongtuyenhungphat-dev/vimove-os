"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

type Option = { id: string; name: string };
type TagOption = { id: string; name: string; color: string };
type TemplateOption = { id: string; name: string; defaultPriority: TaskPriority; checklistItems: string[] };

export function TaskDialog({
  mode,
  task,
  assignees,
  teams,
  projects,
  tags,
  templates,
  action,
}: {
  mode: "create" | "edit";
  task?: {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    assigneeId: string | null;
    teamId: string | null;
    projectId?: string | null;
    startAt: string | null;
    dueAt: string | null;
    estimateHours: number | null;
    tagIds?: string[];
  };
  assignees: Option[];
  teams: Option[];
  /** Tuỳ chọn — chỉ hiện dropdown "Dự án" khi trang gọi truyền danh sách này. */
  projects?: Option[];
  tags?: TagOption[];
  templates?: TemplateOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(task?.tagIds ?? []));

  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyTemplate(templateId: string) {
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;
    setPriority(template.defaultPriority);
    setChecklist(template.checklistItems);
  }

  function handleSubmit(formData: FormData) {
    formData.set("priority", priority);
    checklist.filter((item) => item.trim()).forEach((item) => formData.append("checklistItems", item));
    selectedTags.forEach((tagId) => formData.append("tagIds", tagId));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo công việc" : "Đã cập nhật công việc");
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
          setPriority(task?.priority ?? "MEDIUM");
          setChecklist([]);
          setSelectedTags(new Set(task?.tagIds ?? []));
        }
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo công việc
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${task?.title}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo công việc" : "Sửa công việc"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Thêm công việc mới vào Work Hub." : `Cập nhật "${task?.title}".`}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {mode === "create" && templates && templates.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-template">Tạo từ mẫu (tuỳ chọn)</Label>
              <Select onValueChange={(v) => applyTemplate(String(v))}>
                <SelectTrigger id="task-template" className="w-full">
                  <SelectValue placeholder="Không dùng mẫu" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Tiêu đề</Label>
            <Input id="task-title" name="title" defaultValue={task?.title} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Mô tả</Label>
            <Textarea id="task-description" name="description" defaultValue={task?.description ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority">Độ ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id="task-priority" className="w-full">
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
              <Label htmlFor="task-estimate">Ước lượng (giờ)</Label>
              <Input
                id="task-estimate"
                name="estimateHours"
                type="number"
                min={0}
                step={0.5}
                defaultValue={task?.estimateHours ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-assignee">Người phụ trách</Label>
              <Select name="assigneeId" defaultValue={task?.assigneeId ?? undefined}>
                <SelectTrigger id="task-assignee" className="w-full">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-team">Nhóm</Label>
              <Select name="teamId" defaultValue={task?.teamId ?? undefined}>
                <SelectTrigger id="task-team" className="w-full">
                  <SelectValue placeholder="Không có" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects && projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-project">Dự án</Label>
              <Select name="projectId" defaultValue={task?.projectId ?? undefined}>
                <SelectTrigger id="task-project" className="w-full">
                  <SelectValue placeholder="Không thuộc dự án nào" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-start">Ngày bắt đầu</Label>
              <Input id="task-start" name="startAt" type="date" defaultValue={task?.startAt ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Hạn hoàn thành</Label>
              <Input id="task-due" name="dueAt" type="date" defaultValue={task?.dueAt ?? ""} />
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Nhãn</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs hover:bg-accent"
                  >
                    <Checkbox checked={selectedTags.has(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                    <span style={{ color: tag.color }}>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Checklist</Label>
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
