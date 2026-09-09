"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X, Loader2, ShoppingCart } from "lucide-react";
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
type ProductOption = { id: string; name: string; price: number };
type ItemRow = { productId: string; quantity: number };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function OrderDialog({
  customers,
  channels,
  products,
  defaultCustomerId,
  action,
}: {
  customers: Option[];
  channels: Option[];
  products: ProductOption[];
  /** Khi mở từ trang Customer 360 — chốt sẵn khách hàng, ẩn dropdown chọn. */
  defaultCustomerId?: string;
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ItemRow[]>([{ productId: "", quantity: 1 }]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const total = items.reduce((sum, i) => sum + (productMap.get(i.productId)?.price ?? 0) * i.quantity, 0);

  // Base UI Select.Value cần `items` tường minh để hiện label thay vì raw id khi
  // resting (không mở dropdown) — xem ghi chú trong lead-detail-view.tsx.
  const customerItems = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const channelItems = Object.fromEntries(channels.map((c) => [c.id, c.name]));
  const productSelectItems = Object.fromEntries(products.map((p) => [p.id, `${p.name} — ${formatVnd(p.price)}`]));

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function handleSubmit(formData: FormData) {
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Cần chọn ít nhất 1 sản phẩm");
      return;
    }
    formData.set("itemsJson", JSON.stringify(validItems));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã tạo đơn hàng");
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
        if (v) setItems([{ productId: "", quantity: 1 }]);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Tạo đơn hàng
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng</DialogTitle>
          <DialogDescription>Chọn khách hàng, kênh bán và sản phẩm — tổng tiền tính tự động.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {defaultCustomerId ? (
            <input type="hidden" name="customerId" value={defaultCustomerId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-customer">Khách hàng</Label>
              <Select items={customerItems} name="customerId" required>
                <SelectTrigger id="order-customer" className="w-full">
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
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-channel">Kênh bán</Label>
            <Select items={channelItems} name="channelId">
              <SelectTrigger id="order-channel" className="w-full">
                <SelectValue placeholder="Không rõ kênh" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Sản phẩm</Label>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Select items={productSelectItems} value={item.productId} onValueChange={(v) => updateItem(i, { productId: String(v) })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {formatVnd(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-20 shrink-0"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá dòng sản phẩm ${i + 1}`}
                    disabled={items.length === 1}
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setItems((prev) => [...prev, { productId: "", quantity: 1 }])}
              >
                <Plus /> Thêm dòng
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-notes">Ghi chú</Label>
            <Textarea id="order-notes" name="notes" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShoppingCart className="size-4" aria-hidden="true" /> Tổng tiền
            </span>
            <span className="font-semibold">{formatVnd(total)}</span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Tạo đơn hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
