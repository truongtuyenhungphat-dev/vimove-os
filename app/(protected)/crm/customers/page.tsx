import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listCustomers } from "@/services/crm/customers";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerDialog } from "@/components/crm/customer-dialog";
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

  const [customers, users] = await Promise.all([
    listCustomers(session.user.organizationId, search),
    listUsers(session.user.organizationId),
  ]);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        title="Khách hàng"
        description="Danh sách khách hàng — bấm vào tên để xem Customer 360"
        actions={canCreate ? <CustomerDialog mode="create" owners={activeUsers} action={createCustomerAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Building2} title="Chưa có khách hàng nào" description="Thêm khách hàng đầu tiên hoặc chuyển đổi từ 1 lead đã thắng." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên khách hàng</TableHead>
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
                      <Link href={`/crm/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? c.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.owner?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c._count.leads}</TableCell>
                    <TableCell className="text-muted-foreground">{c._count.orders}</TableCell>
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
