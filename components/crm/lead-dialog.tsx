"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
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
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, type LeadSource } from "@/lib/crm/types";

type Option = { id: string; name: string };

export type LeadFormData = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  value: number | null;
  ownerId: string | null;
};

export function LeadDialog({
  mode,
  lead,
  owners,
  action,
}: {
  mode: "create" | "edit";
  lead?: LeadFormData;
  owners: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [source, setSource] = useState<LeadSource>(lead?.source ?? "MANUAL");
  // Base UI Select.Value cần `items` tường minh để hiện label thay vì raw id khi
  // resting (không mở dropdown) — xem ghi chú trong lead-detail-view.tsx.
  const ownerItems = Object.fromEntries(owners.map((o) => [o.id, o.name]));

  function handleSubmit(formData: FormData) {
    formData.set("source", source);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo lead" : "Đã cập nhật lead");
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
        if (v) setSource(lead?.source ?? "MANUAL");
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo lead
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${lead?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo lead" : "Sửa lead"}</DialogTitle>
          <DialogDescription>Lead cần bán — theo dõi trên pipeline cho tới khi thắng/thua.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-name">Tên lead / công ty</Label>
            <Input id="lead-name" name="name" defaultValue={lead?.name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-contact">Người liên hệ</Label>
              <Input id="lead-contact" name="contactName" defaultValue={lead?.contactName ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-value">Giá trị ước tính (VNĐ)</Label>
              <Input id="lead-value" name="value" type="number" min={0} step={100000} defaultValue={lead?.value ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-email">Email</Label>
              <Input id="lead-email" name="email" type="email" defaultValue={lead?.email ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-phone">Điện thoại</Label>
              <Input id="lead-phone" name="phone" defaultValue={lead?.phone ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-source">Nguồn</Label>
              <Select items={LEAD_SOURCE_LABELS} value={source} onValueChange={(v) => setSource(v as LeadSource)}>
                <SelectTrigger id="lead-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-owner">Người phụ trách</Label>
              <Select items={ownerItems} name="ownerId" defaultValue={lead?.ownerId ?? undefined}>
                <SelectTrigger id="lead-owner" className="w-full">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
