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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DepartmentOption = { id: string; name: string };

export function TeamDialog({
  mode,
  team,
  departments,
  action,
}: {
  mode: "create" | "edit";
  team?: { id: string; name: string; departmentId: string | null };
  departments: DepartmentOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo nhóm" : "Đã cập nhật nhóm");
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
          <Plus /> Tạo nhóm
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa ${team?.name}`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo nhóm" : "Sửa nhóm"}</DialogTitle>
          <DialogDescription>Nhóm dùng để gom người dùng làm việc chung, không nhất thiết theo phòng ban.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-name">Tên nhóm</Label>
            <Input id="team-name" name="name" defaultValue={team?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-department">Phòng ban (tuỳ chọn)</Label>
            <Select
              name="departmentId"
              items={departments.map((d) => ({ value: d.id, label: d.name }))}
              defaultValue={team?.departmentId ?? undefined}
            >
              <SelectTrigger id="team-department" className="w-full">
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
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
