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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Option = { id: string; name: string };

export function PieceDialog({
  channels,
  creators,
  action,
}: {
  channels: Option[];
  creators: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const channelItems = Object.fromEntries(channels.map((c) => [c.id, c.name]));
  const creatorItems = Object.fromEntries(creators.map((c) => [c.id, c.name]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã thêm thẻ nội dung");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thẻ mới
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thẻ nội dung mới</DialogTitle>
          <DialogDescription>Thẻ bắt đầu ở cột &quot;Ý tưởng&quot; — kéo qua các cột khi tiến hành.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="piece-title">Tên nội dung</Label>
            <Input id="piece-title" name="title" placeholder="VD: Video unbox sản phẩm mới" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="piece-channel">Kênh</Label>
            <Select items={channelItems} name="channelId">
              <SelectTrigger id="piece-channel" className="w-full">
                <SelectValue placeholder="Chọn kênh (không bắt buộc)" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="piece-assignee">Người phụ trách</Label>
            <Select items={creatorItems} name="assigneeId">
              <SelectTrigger id="piece-assignee" className="w-full">
                <SelectValue placeholder="Chưa gán (không bắt buộc)" />
              </SelectTrigger>
              <SelectContent>
                {creators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang lưu..." : "Thêm thẻ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
