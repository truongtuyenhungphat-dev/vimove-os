"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/sales/types";

export function OrderStatusSelect({
  orderId,
  status,
  disabled,
  onChange,
}: {
  orderId: string;
  status: OrderStatus;
  disabled?: boolean;
  onChange: (orderId: string, status: OrderStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      items={ORDER_STATUS_LABELS}
      value={status}
      disabled={disabled || isPending}
      onValueChange={(v) => {
        startTransition(async () => {
          try {
            await onChange(orderId, v as OrderStatus);
            toast.success("Đã cập nhật trạng thái đơn hàng");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
