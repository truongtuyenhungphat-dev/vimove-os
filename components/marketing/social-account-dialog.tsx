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
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/marketing/types";

export function SocialAccountDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useState<SocialPlatform>("FACEBOOK");

  function handleSubmit(formData: FormData) {
    formData.set("platform", platform);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã thêm tài khoản");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thêm tài khoản
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản mạng xã hội</DialogTitle>
          <DialogDescription>Danh mục tài khoản để gắn khi lên lịch bài đăng — chưa nối OAuth thật.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="social-platform">Nền tảng</Label>
            <Select items={SOCIAL_PLATFORM_LABELS} value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger id="social-platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {SOCIAL_PLATFORM_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="social-name">Tên hiển thị</Label>
            <Input id="social-name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="social-handle">Handle / Username</Label>
            <Input id="social-handle" name="handle" placeholder="@vimove" />
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
