"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function SocialPostDialog({
  accounts,
  contents,
  action,
}: {
  accounts: Option[];
  contents: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const contentItems = Object.fromEntries(contents.map((c) => [c.id, c.name]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã tạo bài đăng");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={accounts.length === 0} />}>
        <Plus /> Tạo bài đăng
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo bài đăng</DialogTitle>
          <DialogDescription>Lên lịch bài đăng — đăng thật thủ công trên nền tảng rồi đánh dấu &quot;Đã đăng&quot;.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-account">Tài khoản</Label>
            <Select items={accountItems} name="socialAccountId" required>
              <SelectTrigger id="post-account" className="w-full">
                <SelectValue placeholder="Chọn tài khoản" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contents.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-content">Nội dung liên kết</Label>
              <Select items={contentItems} name="contentId">
                <SelectTrigger id="post-content" className="w-full">
                  <SelectValue placeholder="Không liên kết" />
                </SelectTrigger>
                <SelectContent>
                  {contents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-caption">Nội dung bài đăng</Label>
            <Textarea id="post-caption" name="caption" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-scheduled">Lên lịch đăng (tuỳ chọn)</Label>
            <Input id="post-scheduled" name="scheduledAt" type="datetime-local" />
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
