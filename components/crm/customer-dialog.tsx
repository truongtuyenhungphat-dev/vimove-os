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

type Option = { id: string; name: string };

export type CustomerFormData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  ownerId: string | null;
};

export function CustomerDialog({
  mode,
  customer,
  owners,
  action,
}: {
  mode: "create" | "edit";
  customer?: CustomerFormData;
  owners: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Base UI Select.Value cần `items` tường minh để hiện label thay vì raw id khi
  // resting (không mở dropdown) — xem ghi chú trong lead-detail-view.tsx.
  const ownerItems = Object.fromEntries(owners.map((o) => [o.id, o.name]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo khách hàng" : "Đã cập nhật khách hàng");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Thêm khách hàng
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${customer?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm khách hàng" : "Sửa khách hàng"}</DialogTitle>
          <DialogDescription>Thông tin khách hàng dùng cho Customer 360 và đơn hàng.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-name">Tên khách hàng</Label>
            <Input id="customer-name" name="name" defaultValue={customer?.name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" name="email" type="email" defaultValue={customer?.email ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer-phone">Điện thoại</Label>
              <Input id="customer-phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-company">Công ty</Label>
            <Input id="customer-company" name="company" defaultValue={customer?.company ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-address">Địa chỉ</Label>
            <Input id="customer-address" name="address" defaultValue={customer?.address ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-owner">Người phụ trách</Label>
            <Select items={ownerItems} name="ownerId" defaultValue={customer?.ownerId ?? undefined}>
              <SelectTrigger id="customer-owner" className="w-full">
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
