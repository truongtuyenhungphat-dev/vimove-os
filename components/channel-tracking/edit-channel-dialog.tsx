"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ChannelRow } from "@/services/channel-tracking/channels";

export function EditChannelDialog({
  channel,
  open,
  onOpenChange,
  updateAction,
}: {
  channel: ChannelRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateAction: (id: string, data: { label?: string; url?: string }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateAction(channel.id, {
          label: String(formData.get("label") ?? ""),
          url: String(formData.get("url") ?? ""),
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sửa @{channel.username}</DialogTitle>
          <DialogDescription>Nền tảng không đổi được — gỡ kênh và thêm lại nếu cần chuyển nền tảng.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-channel-url">Link kênh</Label>
            <Input id="edit-channel-url" name="url" defaultValue={channel.url} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-channel-label">Ghi chú</Label>
            <Input id="edit-channel-label" name="label" defaultValue={channel.label ?? ""} placeholder="VD: Kênh công ty A" maxLength={200} />
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
