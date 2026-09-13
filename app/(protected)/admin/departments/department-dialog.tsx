"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DepartmentOption = { id: string; name: string };

export function DepartmentDialog({
  mode,
  department,
  departments,
  action,
}: {
  mode: "create" | "edit";
  department?: { id: string; name: string; parentId: string | null };
  departments: DepartmentOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const parentOptions = departments.filter((d) => d.id !== department?.id);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo phòng ban" : "Đã cập nhật phòng ban");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo phòng ban
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa ${department?.name}`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo phòng ban" : "Sửa phòng ban"}</DialogTitle>
          <DialogDescription>Phòng ban dùng để tổ chức người dùng và nhóm.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">Tên phòng ban</Label>
            <Input id="dept-name" name="name" defaultValue={department?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-parent">Trực thuộc (tuỳ chọn)</Label>
            <Select
              name="parentId"
              items={parentOptions.map((opt) => ({ value: opt.id, label: opt.name }))}
              defaultValue={department?.parentId ?? undefined}
            >
              <SelectTrigger id="dept-parent" className="w-full">
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
