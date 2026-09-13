import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, UserPlus, ShoppingBag } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listCustomers, getCustomersSummary } from "@/services/crm/customers";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerDialog } from "@/components/crm/customer-dialog";
import { CustomerSearchBar } from "@/components/crm/customer-search-bar";
import { createCustomerAction } from "./actions";

export const metadata: Metadata = { title: "Khách hàng — VIMOVE OS" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await requirePermission("customers.read");
  const canCreate = hasPermission(session, "customers.create");
  const { search } = await searchParams;

  const [customers, users, summary] = await Promise.all([
    listCustomers(session.user.organizationId, search),
    listUsers(session.user.organizationId),
    getCustomersSummary(session.user.organizationId),
  ]);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        title="Khách hàng"
        description="Danh sách khách hàng — bấm vào tên để xem Customer 360"
        actions={canCreate ? <CustomerDialog mode="create" owners={activeUsers} action={createCustomerAction} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Tổng khách hàng" value={summary.total} icon={Users} tone="muted" />
        <KpiCard label="Khách hàng mới tháng này" value={summary.newThisMonth} icon={UserPlus} tone={summary.newThisMonth > 0 ? "primary" : "muted"} />
        <KpiCard label="Đã từng mua hàng" value={summary.withOrders} icon={ShoppingBag} tone="muted" hint={summary.total > 0 ? `${Math.round((summary.withOrders / summary.total) * 100)}% tổng khách hàng` : undefined} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <CustomerSearchBar />
        {search && <p className="text-sm text-muted-foreground">{customers.length} kết quả cho &quot;{search}&quot;</p>}
      </div>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title={search ? "Không tìm thấy khách hàng nào" : "Chưa có khách hàng nào"}
                description={search ? "Thử từ khoá khác hoặc xoá bộ lọc tìm kiếm." : "Thêm khách hàng đầu tiên hoặc chuyển đổi từ 1 lead đã thắng."}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Người phụ trách</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{c.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/crm/customers/${c.id}`} className="font-medium hover:underline">
                            {c.name}
                          </Link>
                          {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? c.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.owner?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-transparent bg-muted font-normal">
                        {c._count.leads}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent font-normal ${c._count.orders > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                      >
                        {c._count.orders}
                      </Badge>
                    </TableCell>
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
