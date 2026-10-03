"use client";

import { useState, useActionState, useEffect } from "react";
import { Loader2, CheckCircle2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "cn";
import { trackLeadEvent } from "@/components/public/lead-tracking";
import { submitProductOrderAction, type SubmitOrderState } from "@/app/(public)/san-pham/[slug]/actions";

function OptionPills({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              value === opt ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductOrderPanel({
  productId,
  productName,
  productSlug,
  sizes,
  colors,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  sizes: string[];
  colors: string[];
}) {
  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<SubmitOrderState, FormData>(submitProductOrderAction, undefined);

  useEffect(() => {
    if (state?.ok) {
      trackLeadEvent({ contentName: productName, contentIds: [productSlug] });
    }
  }, [state?.ok, productName, productSlug]);

  return (
    <div className="flex flex-col gap-5">
      <OptionPills label="Kích thước" options={sizes} value={size} onChange={setSize} />
      <OptionPills label="Màu sắc" options={colors} value={color} onChange={setColor} />

      <div>
        <p className="mb-2 text-sm font-medium">Số lượng</p>
        <div className="flex w-fit items-center rounded-lg border">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">
            <Minus className="size-3.5" />
          </Button>
          <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQuantity((q) => Math.min(50, q + 1))} aria-label="Tăng số lượng">
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <Button size="lg" onClick={() => setOpen(true)}>
        <ShoppingBag className="size-4" aria-hidden="true" /> Đặt đơn
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {state?.ok ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
              <p className="font-medium">Đã nhận đơn của bạn!</p>
              <p className="text-sm text-muted-foreground">Vimove sẽ gọi điện xác nhận trong thời gian sớm nhất — chưa cần thanh toán trước.</p>
              <Button className="mt-2 w-full" onClick={() => setOpen(false)}>
                Đóng
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Đặt đơn</DialogTitle>
                <DialogDescription>
                  {productName}
                  {size && ` · ${size}`}
                  {color && ` · ${color}`} · SL: {quantity}
                </DialogDescription>
              </DialogHeader>
              <form action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="quantity" value={quantity} />
                <input type="hidden" name="size" value={size} />
                <input type="hidden" name="color" value={color} />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="po-name">Họ và tên</Label>
                  <Input id="po-name" name="customerName" required placeholder="Nguyễn Văn A" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="po-phone">Số điện thoại</Label>
                  <Input id="po-phone" name="phone" type="tel" required placeholder="0912 345 678" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="po-address">Địa chỉ nhận hàng</Label>
                  <Input id="po-address" name="address" required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="po-note">Ghi chú</Label>
                  <Textarea id="po-note" name="note" rows={2} />
                </div>

                {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

                <DialogFooter>
                  <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {isPending ? "Đang gửi..." : "Xác nhận đặt đơn"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
