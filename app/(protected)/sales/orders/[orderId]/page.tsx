import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getOrder } from "@/services/sales/orders";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusSelect } from "@/components/sales/order-status-select";
import { updateOrderStatusAction, deleteOrderAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết đơn hàng — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.product.name}</p>
                      {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatVnd(item.unitPrice)}</TableCell>
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
            <div>
              <p className="text-muted-foreground">Khách hàng</p>
              <Link href={`/crm/customers/${order.customer.id}`} className="font-medium text-primary hover:underline">
                {order.customer.name}
              </Link>
            </div>
            {order.customer.email && (
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{order.customer.email}</p>
              </div>
            )}
            {order.owner && (
              <div>
                <p className="text-muted-foreground">Người phụ trách</p>
                <p>{order.owner.name}</p>
              </div>
            )}
            {order.notes && (
              <div>
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
