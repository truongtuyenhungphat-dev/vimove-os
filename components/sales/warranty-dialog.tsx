"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
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
import { WARRANTY_STATUSES, WARRANTY_STATUS_LABELS, type WarrantyStatus } from "@/lib/warranty/types";

type Option = { id: string; name: string };

export type WarrantyFormData = {
  id: string;
  customerId: string;
  productName: string;
  color: string | null;
  size: string | null;
  purchaseChannel: string | null;
  purchaseDate: string | null;
  activatedAt: string | null;
  warrantyExpiry: string | null;
  warrantyCode: string;
  status: WarrantyStatus;
  notes: string | null;
};

function toDateInputValue(v: string | null): string {
  if (!v) return "";
  return v.slice(0, 10);
}

export function WarrantyDialog({
  mode,
  warranty,
  customers,
  action,
}: {
  mode: "create" | "edit";
  warranty?: WarrantyFormData;
  customers: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const customerItems = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const statusItems = Object.fromEntries(WARRANTY_STATUSES.map((s) => [s, WARRANTY_STATUS_LABELS[s]]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã đăng ký bảo hành" : "Đã cập nhật bảo hành");
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
          <Plus /> Đăng ký bảo hành
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa bảo hành "${warranty?.warrantyCode}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Đăng ký bảo hành" : "Sửa bảo hành"}</DialogTitle>
          <DialogDescription>Mã bảo hành khớp với mã in trên nhãn/QR sản phẩm — dùng để tra cứu.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-code">Mã bảo hành</Label>
              <Input id="warranty-code" name="warrantyCode" defaultValue={warranty?.warrantyCode} placeholder="VM-XXXXXX" required disabled={mode === "edit"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-customer">Khách hàng</Label>
              <Select items={customerItems} name="customerId" defaultValue={warranty?.customerId} required>
                <SelectTrigger id="warranty-customer" className="w-full">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warranty-product">Tên sản phẩm</Label>
            <Input id="warranty-product" name="productName" defaultValue={warranty?.productName} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-color">Màu sắc</Label>
              <Input id="warranty-color" name="color" defaultValue={warranty?.color ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-size">Kích thước</Label>
              <Input id="warranty-size" name="size" defaultValue={warranty?.size ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-channel">Kênh mua hàng</Label>
              <Input id="warranty-channel" name="purchaseChannel" defaultValue={warranty?.purchaseChannel ?? ""} placeholder="Shopee, TikTok Shop..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-status">Trạng thái</Label>
              <Select items={statusItems} name="status" defaultValue={warranty?.status ?? "ACTIVE"} required>
                <SelectTrigger id="warranty-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARRANTY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {WARRANTY_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-purchase-date">Ngày mua</Label>
              <Input id="warranty-purchase-date" name="purchaseDate" type="date" defaultValue={toDateInputValue(warranty?.purchaseDate ?? null)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warranty-activated-at">Ngày kích hoạt bảo hành</Label>
              <Input
                id="warranty-activated-at"
                name="activatedAt"
                type="date"
                defaultValue={toDateInputValue(warranty?.activatedAt ?? null) || (mode === "create" ? toDateInputValue(new Date().toISOString()) : "")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warranty-expiry">Hết hạn bảo hành</Label>
            <Input id="warranty-expiry" name="warrantyExpiry" type="date" defaultValue={toDateInputValue(warranty?.warrantyExpiry ?? null)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warranty-notes">Ghi chú</Label>
            <Textarea id="warranty-notes" name="notes" rows={2} defaultValue={warranty?.notes ?? ""} />
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
