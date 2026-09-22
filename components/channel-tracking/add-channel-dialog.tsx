"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/channel-tracking/types";

const PLATFORM_ITEMS = Object.fromEntries(PLATFORMS.map((p) => [p, PLATFORM_LABEL[p]]));

export function AddChannelDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã thêm kênh theo dõi");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thêm kênh
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thêm kênh theo dõi</DialogTitle>
          <DialogDescription>Dán link kênh hoặc gõ @username — hệ thống tự nhận diện.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-channel-platform">Nền tảng</Label>
            <Select items={PLATFORM_ITEMS} name="platform" defaultValue={"TIKTOK" as Platform} required>
              <SelectTrigger id="add-channel-platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-channel-url">Link kênh</Label>
            <Input id="add-channel-url" name="url" placeholder="https://... hoặc @username" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-channel-label">Ghi chú</Label>
            <Input id="add-channel-label" name="label" placeholder="VD: Kênh công ty A" maxLength={200} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang thêm..." : "Thêm kênh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
