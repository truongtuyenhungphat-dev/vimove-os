import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listOrders } from "@/services/sales/orders";
import { listCustomers } from "@/services/crm/customers";
import { listSalesChannels } from "@/services/sales/channels";
import { listProducts } from "@/services/sales/products";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderDialog } from "@/components/sales/order-dialog";
import { ORDER_STATUS_LABELS } from "@/lib/sales/types";
import { createOrderAction } from "./actions";

export const metadata: Metadata = { title: "Đơn hàng — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  FULFILLED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default async function OrdersPage() {
  const session = await requirePermission("orders.read");
  const canCreate = hasPermission(session, "orders.create");

  const [orders, customers, channels, products] = await Promise.all([
    listOrders(session.user.organizationId),
    listCustomers(session.user.organizationId),
    listSalesChannels(session.user.organizationId),
    listProducts(session.user.organizationId, false),
  ]);

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description="Danh sách đơn hàng liên kết khách hàng, sản phẩm và kênh bán"
        actions={
          canCreate ? (
            <OrderDialog
              customers={customers.map((c) => ({ id: c.id, name: c.name }))}
              channels={channels.map((c) => ({ id: c.id, name: c.name }))}
              products={products.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
              action={createOrderAction}
            />
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ShoppingCart} title="Chưa có đơn hàng nào" description="Tạo đơn hàng đầu tiên để bắt đầu theo dõi doanh thu." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Kênh bán</TableHead>
                  <TableHead>Số dòng</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/sales/orders/${o.id}`} className="font-medium hover:underline">
                        {o.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.channel?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{o._count.items}</TableCell>
                    <TableCell>{formatVnd(o.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[o.status]}`}>
                        {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(o.orderDate).toLocaleDateString("vi-VN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
