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

export type ProductData = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  unit: string | null;
  isActive: boolean;
};

export function ProductDialog({
  mode,
  product,
  action,
}: {
  mode: "create" | "edit";
  product?: ProductData;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  function handleSubmit(formData: FormData) {
    formData.set("isActive", isActive ? "true" : "false");
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo sản phẩm" : "Đã cập nhật sản phẩm");
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
        if (v) setIsActive(product?.isActive ?? true);
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Thêm sản phẩm
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${product?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</DialogTitle>
          <DialogDescription>Sản phẩm dùng để lên đơn hàng ở Sales.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Tên sản phẩm</Label>
            <Input id="product-name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-sku">SKU</Label>
              <Input id="product-sku" name="sku" defaultValue={product?.sku ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-unit">Đơn vị</Label>
              <Input id="product-unit" name="unit" placeholder="cái, gói, giờ..." defaultValue={product?.unit ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-price">Giá bán (VNĐ)</Label>
            <Input id="product-price" name="price" type="number" min={0} step={1000} defaultValue={product?.price ?? ""} required />
          </div>
          {mode === "edit" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              Đang bán
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
