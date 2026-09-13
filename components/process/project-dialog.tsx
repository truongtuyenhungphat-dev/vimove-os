"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
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
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/process/types";

type Option = { id: string; name: string };

export function ProjectDialog({
  mode,
  project,
  users,
  action,
}: {
  mode: "create" | "edit";
  project?: {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    startAt: string | null;
    endAt: string | null;
  };
  users: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "PLANNING");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    if (mode === "edit") formData.set("status", status);
    selectedMembers.forEach((id) => formData.append("memberIds", id));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo dự án" : "Đã cập nhật dự án");
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
          setStatus(project?.status ?? "PLANNING");
          setSelectedMembers(new Set());
        }
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo dự án
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa dự án "${project?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo dự án" : "Sửa dự án"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Thêm dự án mới." : `Cập nhật "${project?.name}".`}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Tên dự án</Label>
            <Input id="project-name" name="name" defaultValue={project?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">Mô tả</Label>
            <Textarea id="project-description" name="description" defaultValue={project?.description ?? ""} />
          </div>

          {mode === "edit" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-status">Trạng thái</Label>
              <Select
                items={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
              >
                <SelectTrigger id="project-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-start">Bắt đầu</Label>
              <Input id="project-start" name="startAt" type="date" defaultValue={project?.startAt ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-end">Kết thúc</Label>
              <Input id="project-end" name="endAt" type="date" defaultValue={project?.endAt ?? ""} />
            </div>
          </div>

          {mode === "create" && (
            <div className="flex flex-col gap-1.5">
              <Label>Thành viên (tuỳ chọn, bạn tự động là chủ dự án)</Label>
              <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border p-2">
                {users.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                    <Checkbox checked={selectedMembers.has(u.id)} onCheckedChange={() => toggleMember(u.id)} />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
          )}

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
