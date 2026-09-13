import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Mail, Store, CalendarClock, X } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getOrder } from "@/services/sales/orders";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/sales/order-status-select";
import { updateOrderStatusAction, deleteOrderAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết đơn hàng — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const FULFILLMENT_STEPS = [
  { status: "DRAFT", label: "Nháp" },
  { status: "CONFIRMED", label: "Đã xác nhận" },
  { status: "FULFILLED", label: "Đã giao" },
] as const;

/** Dải bước xử lý đơn hàng — chỉ áp dụng cho luồng thuận (Draft → Confirmed →
 * Fulfilled); Cancelled/Refunded là trạng thái kết thúc riêng, hiển thị badge
 * thay vì gắn vào dải bước để tránh gây hiểu nhầm "đơn đã đi được bao xa". */
function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <X className="size-4" />
        {status === "CANCELLED" ? "Đơn hàng đã bị huỷ" : "Đơn hàng đã được hoàn tiền"}
      </div>
    );
  }
  const currentIndex = FULFILLMENT_STEPS.findIndex((s) => s.status === status);
  return (
    <div className="flex items-start">
      {FULFILLMENT_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step.status} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-medium",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn("text-xs whitespace-nowrap", done ? "font-medium text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </div>
            {i < FULFILLMENT_STEPS.length - 1 && (
              <div className={cn("mx-2 mt-3.5 h-0.5 w-10 sm:w-16", i < currentIndex ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await requirePermission("orders.read");
  const { orderId } = await params;
  const order = await getOrder(session.user.organizationId, orderId);
  if (!order) notFound();

  const canUpdate = hasPermission(session, "orders.update");
  const canDelete = hasPermission(session, "orders.delete");

  return (
    <>
      <PageHeader
        title={`Đơn hàng của ${order.customer.name}`}
        description={`Đặt ngày ${new Date(order.orderDate).toLocaleDateString("vi-VN")} · Kênh: ${order.channel?.name ?? "Không rõ"}`}
        actions={
          <div className="flex items-center gap-2">
            <OrderStatusSelect orderId={order.id} status={order.status} disabled={!canUpdate} onChange={updateOrderStatusAction} />
            {canDelete && order.status === "DRAFT" && (
              <ConfirmDeleteButton
                title="Xoá đơn hàng"
                description="Chỉ xoá được đơn ở trạng thái Nháp — không thể hoàn tác."
                onConfirm={deleteOrderAction.bind(null, order.id)}
              />
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <OrderStatusTimeline status={order.status} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="hidden sm:table-cell">SL</TableHead>
                  <TableHead className="hidden sm:table-cell">Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.product.name}</p>
                      {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                      {/* SL/đơn giá gộp vào đây trên mobile — 2 cột riêng bị ẩn dưới
                       * sm: để bảng không tràn ngang trên màn hình hẹp (phát hiện
                       * thật khi test 414px, 4 cột không đủ chỗ). */}
                      <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                        {item.quantity} × {formatVnd(item.unitPrice)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{item.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatVnd(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatVnd(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t border-border p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Tổng cộng</span>
                <span className="text-lg font-semibold">{formatVnd(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{order.customer.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/crm/customers/${order.customer.id}`} className="font-medium text-primary hover:underline">
                  {order.customer.name}
                </Link>
                {order.owner && <p className="text-xs text-muted-foreground">Phụ trách bởi {order.owner.name}</p>}
              </div>
            </div>
            {order.customer.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="text-foreground">{order.customer.email}</span>
              </div>
            )}
            {order.channel && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="size-4 shrink-0" />
                <span className="text-foreground">{order.channel.name}</span>
              </div>
            )}
            {order.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground">Ghi chú</p>
                <p>{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
