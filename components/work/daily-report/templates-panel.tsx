"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, MoreHorizontal, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/work/types";

type Template = { id: string; title: string; roleTitle: string; priority: string };

const PRIORITY_ITEMS = Object.fromEntries(TASK_PRIORITIES.map((p) => [p, TASK_PRIORITY_LABELS[p]]));

function AddTemplateDialog({ roleTitles, createAction }: { roleTitles: string[]; createAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createAction(formData);
        toast.success("Đã thêm mẫu việc");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thêm mẫu việc
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thêm mẫu việc cố định</DialogTitle>
          <DialogDescription>Áp dụng cho mọi nhân sự có vai trò (chức danh) khớp — tự sinh mỗi ngày làm việc.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-tpl-role">Vai trò áp dụng</Label>
            <Input id="add-tpl-role" name="roleTitle" list="role-title-options" placeholder="VD: Content" required />
            <datalist id="role-title-options">
              {roleTitles.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-tpl-title">Tên việc</Label>
            <Input id="add-tpl-title" name="title" placeholder="VD: Viết bài Facebook" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-tpl-priority">Mức ưu tiên</Label>
            <Select items={PRIORITY_ITEMS} name="priority" defaultValue={"MEDIUM" as TaskPriority}>
              <SelectTrigger id="add-tpl-priority" className="w-full">
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang thêm..." : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTemplateDialog({
  template,
  open,
  onOpenChange,
  updateAction,
}: {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateAction: (id: string, data: { title: string; priority?: string }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateAction(template.id, { title: String(formData.get("title") ?? ""), priority: String(formData.get("priority") ?? "") });
        toast.success("Đã lưu");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sửa mẫu việc</DialogTitle>
          <DialogDescription>Vai trò áp dụng ({template.roleTitle}) không đổi được — xoá và thêm lại nếu cần đổi.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-tpl-title">Tên việc</Label>
            <Input id="edit-tpl-title" name="title" defaultValue={template.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-tpl-priority">Mức ưu tiên</Label>
            <Select items={PRIORITY_ITEMS} name="priority" defaultValue={template.priority as TaskPriority}>
              <SelectTrigger id="edit-tpl-priority" className="w-full">
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesPanel({
  templates,
  roleTitles,
  createAction,
  updateAction,
  deleteAction,
}: {
  templates: Template[];
  roleTitles: string[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (id: string, data: { title: string; priority?: string }) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [isPending, setIsPending] = useState(false);

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.roleTitle] ??= []).push(t);
    return acc;
  }, {});

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsPending(true);
    try {
      await deleteAction(deleteTarget.id);
      toast.success("Đã xoá mẫu việc");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddTemplateDialog roleTitles={roleTitles} createAction={createAction} />
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={ListChecks} title="Chưa có mẫu việc nào" description="Thêm mẫu việc cố định theo vai trò để tự sinh checklist mỗi ngày." />
      ) : (
        Object.entries(grouped).map(([roleTitle, list]) => (
          <div key={roleTitle}>
            <h3 className="mb-2 text-sm font-medium">{roleTitle}</h3>
            <div className="flex flex-col gap-1.5">
              {list.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.title}</span>
                    <Badge variant="outline" className="font-normal">
                      {TASK_PRIORITY_LABELS[t.priority as TaskPriority]}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${t.title}`} />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(t)}>
                        <Pencil className="size-4" /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="size-4" /> Xoá
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editTarget && <EditTemplateDialog template={editTarget} open onOpenChange={(open) => !open && setEditTarget(null)} updateAction={updateAction} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá mẫu việc</AlertDialogTitle>
            <AlertDialogDescription>Xoá &quot;{deleteTarget?.title}&quot; — các item đã sinh trước đó vẫn giữ nguyên, chỉ không sinh mới nữa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={confirmDelete}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
