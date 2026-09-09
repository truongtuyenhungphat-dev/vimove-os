"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SALES_CHANNEL_TYPES, SALES_CHANNEL_TYPE_LABELS, type SalesChannelType } from "@/lib/sales/types";

export type SalesChannelData = { id: string; name: string; type: SalesChannelType; isActive: boolean };

export function ChannelDialog({
  mode,
  channel,
  action,
}: {
  mode: "create" | "edit";
  channel?: SalesChannelData;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<SalesChannelType>(channel?.type ?? "ONLINE");
  const [isActive, setIsActive] = useState(channel?.isActive ?? true);

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("isActive", isActive ? "true" : "false");
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo kênh bán" : "Đã cập nhật kênh bán");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setType(channel?.type ?? "ONLINE");
          setIsActive(channel?.isActive ?? true);
        }
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Thêm kênh bán
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${channel?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm kênh bán" : "Sửa kênh bán"}</DialogTitle>
          <DialogDescription>Kênh bán gắn với đơn hàng để theo dõi doanh thu theo kênh.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-name">Tên kênh</Label>
            <Input id="channel-name" name="name" defaultValue={channel?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-type">Loại kênh</Label>
            <Select items={SALES_CHANNEL_TYPE_LABELS} value={type} onValueChange={(v) => setType(v as SalesChannelType)}>
              <SelectTrigger id="channel-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_CHANNEL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SALES_CHANNEL_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "edit" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              Đang hoạt động
            </label>
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
