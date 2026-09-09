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

export function EmailCampaignDialog({ campaigns, action }: { campaigns: Option[]; action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const campaignItems = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã tạo email campaign");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Tạo email campaign
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo email campaign</DialogTitle>
          <DialogDescription>Chưa nối provider email thật — &quot;Gửi&quot; chỉ đánh dấu trạng thái.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-name">Tên chiến dịch email</Label>
            <Input id="email-name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-subject">Tiêu đề email</Label>
            <Input id="email-subject" name="subject" required />
          </div>
          {campaigns.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email-campaign">Chiến dịch marketing</Label>
              <Select items={campaignItems} name="campaignId">
                <SelectTrigger id="email-campaign" className="w-full">
                  <SelectValue placeholder="Không thuộc chiến dịch nào" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
