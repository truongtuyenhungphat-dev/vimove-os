"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AddTrainingVideoDialog({ action, categories }: { action: (formData: FormData) => Promise<void>; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã thêm video");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thêm video
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm video đào tạo</DialogTitle>
          <DialogDescription>Danh mục có thể chọn từ danh sách đang có hoặc gõ danh mục mới.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-video-category">Danh mục</Label>
            <Input id="add-video-category" name="category" list="training-category-options" placeholder="VD: Re-stream" required />
            <datalist id="training-category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-video-title">Tên video</Label>
            <Input id="add-video-title" name="title" placeholder="VD: Re-stream #01 | ..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-video-date">Ngày đăng</Label>
            <Input id="add-video-date" name="publishedDate" type="date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-video-youtube">Link YouTube</Label>
            <Input id="add-video-youtube" name="youtubeUrl" placeholder="https://youtu.be/..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-video-mbs">Link bài trên MBS</Label>
            <Input id="add-video-mbs" name="mbsUrl" placeholder="https://mbs.makeviral.pro/..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang thêm..." : "Thêm video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
