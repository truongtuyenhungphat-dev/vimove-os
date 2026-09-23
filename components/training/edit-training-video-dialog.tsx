"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TrainingVideoRow } from "./training-video-table";

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function EditTrainingVideoDialog({
  video,
  categories,
  open,
  onOpenChange,
  updateAction,
}: {
  video: TrainingVideoRow;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateAction: (id: string, data: { category: string; title: string; publishedDate?: string; youtubeUrl: string; mbsUrl?: string }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateAction(video.id, {
          category: String(formData.get("category") ?? ""),
          title: String(formData.get("title") ?? ""),
          publishedDate: String(formData.get("publishedDate") ?? "") || undefined,
          youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
          mbsUrl: String(formData.get("mbsUrl") ?? "") || undefined,
        });
        toast.success("Đã lưu");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa video đào tạo</DialogTitle>
          <DialogDescription>{video.title}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video-category">Danh mục</Label>
            <Input id="edit-video-category" name="category" list="training-category-options-edit" defaultValue={video.category} required />
            <datalist id="training-category-options-edit">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video-title">Tên video</Label>
            <Input id="edit-video-title" name="title" defaultValue={video.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video-date">Ngày đăng</Label>
            <Input id="edit-video-date" name="publishedDate" type="date" defaultValue={toDateInputValue(video.publishedDate)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video-youtube">Link YouTube</Label>
            <Input id="edit-video-youtube" name="youtubeUrl" defaultValue={video.youtubeUrl} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video-mbs">Link bài trên MBS</Label>
            <Input id="edit-video-mbs" name="mbsUrl" defaultValue={video.mbsUrl ?? ""} />
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
