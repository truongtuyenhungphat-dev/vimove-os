import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, ShoppingCart, Target, Trophy } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getCustomer360 } from "@/services/crm/customers";
import { listUsers } from "@/services/core/users";
import { listSalesChannels } from "@/services/sales/channels";
import { listProducts } from "@/services/sales/products";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomerDialog } from "@/components/crm/customer-dialog";
import { OrderDialog } from "@/components/sales/order-dialog";
import { PIPELINE_STAGE_TYPE_LABELS } from "@/lib/crm/types";
import { ORDER_STATUS_LABELS } from "@/lib/sales/types";
import { updateCustomerAction, deleteCustomerAction } from "../actions";
import { createOrderAction } from "../../../sales/orders/actions";

export const metadata: Metadata = { title: "Customer 360 — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function Customer360Page({ params }: { params: Promise<{ customerId: string }> }) {
  const session = await requirePermission("customers.read");
  const { customerId } = await params;
  const customer = await getCustomer360(session.user.organizationId, customerId);
  if (!customer) notFound();

  const canUpdate = hasPermission(session, "customers.update");
  const canDelete = hasPermission(session, "customers.delete");
  const canCreateOrder = hasPermission(session, "orders.create");

  const [users, channels, products] = await Promise.all([
    listUsers(session.user.organizationId),
    listSalesChannels(session.user.organizationId),
    listProducts(session.user.organizationId, false),
  ]);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.company ?? "Customer 360 — hồ sơ tổng hợp lead, đơn hàng và doanh thu"}
        actions={
          <div className="flex items-center gap-2">
            {canCreateOrder && (
              <OrderDialog
                customers={[{ id: customer.id, name: customer.name }]}
                channels={channels.map((c) => ({ id: c.id, name: c.name }))}
                products={products.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
                defaultCustomerId={customer.id}
                action={createOrderAction}
              />
            )}
            {canUpdate && (
              <CustomerDialog mode="edit" customer={customer} owners={activeUsers} action={updateCustomerAction.bind(null, customer.id)} />
            )}
            {canDelete && (
              <ConfirmDeleteButton title="Xoá khách hàng" description={`Xoá khách hàng "${customer.name}" — không thể hoàn tác.`} onConfirm={deleteCustomerAction.bind(null, customer.id)} />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng doanh thu (LTV)" value={formatVnd(customer.stats.totalRevenue)} icon={Wallet} />
        <KpiCard label="Số đơn hàng" value={customer.stats.orderCount} icon={ShoppingCart} />
        <KpiCard label="Số lead" value={customer.stats.leadCount} icon={Target} />
        <KpiCard label="Lead đã thắng" value={customer.stats.wonLeadCount} icon={Trophy} />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p>{customer.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Điện thoại</p>
            <p>{customer.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Địa chỉ</p>
            <p>{customer.address ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Người phụ trách</p>
            <p>{customer.owner?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Đơn hàng ({customer.orders.length})</TabsTrigger>
              <TabsTrigger value="leads">Lead ({customer.leads.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="pt-3">
              {customer.orders.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Chưa có đơn hàng nào" />
              ) : (
                <div className="flex flex-col gap-2">
                  {customer.orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/sales/orders/${o.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{o.channel?.name ?? "Không rõ kênh"} · {o.itemCount} sản phẩm</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.orderDate).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatVnd(o.totalAmount)}</span>
                        <Badge variant="outline" className="border-transparent bg-muted font-normal">
                          {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="leads" className="pt-3">
              {customer.leads.length === 0 ? (
                <EmptyState icon={Target} title="Chưa có lead nào" />
              ) : (
                <div className="flex flex-col gap-2">
                  {customer.leads.map((l) => (
                    <Link key={l.id} href={`/crm/leads/${l.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-accent">
                      <p className="font-medium">{l.name}</p>
                      <Badge variant="outline" className="border-transparent bg-muted font-normal">
                        {l.stage.name} · {PIPELINE_STAGE_TYPE_LABELS[l.stage.type]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
