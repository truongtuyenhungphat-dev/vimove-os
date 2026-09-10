"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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

export function ShiftDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã tạo ca làm việc");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus aria-hidden="true" /> Tạo ca làm việc
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo ca làm việc</DialogTitle>
          <DialogDescription>Mẫu ca dùng để xếp cho nhân sự theo ngày.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift-name">Tên ca</Label>
            <Input id="shift-name" name="name" placeholder="Ca hành chính" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-start">Giờ bắt đầu</Label>
              <Input id="shift-start" name="startTime" type="time" defaultValue="08:00" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-end">Giờ kết thúc</Label>
              <Input id="shift-end" name="endTime" type="time" defaultValue="17:00" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-break">Nghỉ giữa ca (phút)</Label>
              <Input id="shift-break" name="breakMinutes" type="number" min={0} defaultValue={60} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-color">Màu hiển thị</Label>
              <Input id="shift-color" name="colorHex" type="color" defaultValue="#2563eb" className="h-8 p-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Tạo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
