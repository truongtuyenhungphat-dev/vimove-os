import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listWarranties } from "@/services/warranty/warranties";
import { listCustomers } from "@/services/crm/customers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarrantyDialog } from "@/components/sales/warranty-dialog";
import { WARRANTY_STATUS_LABELS } from "@/lib/warranty/types";
import { createWarrantyAction, updateWarrantyAction, deleteWarrantyAction } from "./actions";

export const metadata: Metadata = { title: "Bảo hành — VIMOVE OS" };

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CLAIMED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  EXPIRED: "bg-muted text-muted-foreground",
  VOIDED: "bg-destructive/10 text-destructive",
};

function fmtDate(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "—";
}

export default async function WarrantyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await requirePermission("warranty.read");
  const canCreate = hasPermission(session, "warranty.create");
  const canUpdate = hasPermission(session, "warranty.update");
  const canDelete = hasPermission(session, "warranty.delete");
  const { search } = await searchParams;

  const [warranties, customers] = await Promise.all([
    listWarranties(session.user.organizationId, { search }),
    listCustomers(session.user.organizationId),
  ]);
  const customerOptions = customers.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Bảo hành"
        description="Đăng ký và theo dõi bảo hành sản phẩm theo khách hàng"
        actions={canCreate ? <WarrantyDialog mode="create" customers={customerOptions} action={createWarrantyAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {warranties.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={BadgeCheck} title="Chưa có bảo hành nào" description="Đăng ký bảo hành đầu tiên để bắt đầu theo dõi." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã bảo hành</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Kênh mua</TableHead>
                  <TableHead>Hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.warrantyCode}</TableCell>
                    <TableCell>
                      <Link href={`/crm/customers/${w.customer.id}`} className="hover:underline">
                        {w.customer.name}
                      </Link>
                      {w.customer.phone && <p className="text-xs text-muted-foreground">{w.customer.phone}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.productName}
                      {(w.color || w.size) && (
                        <p className="text-xs text-muted-foreground">{[w.color, w.size].filter(Boolean).join(" · ")}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{w.purchaseChannel ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(w.warrantyExpiry)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[w.status]}`}>
                        {WARRANTY_STATUS_LABELS[w.status]}
                      </Badge>
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <WarrantyDialog
                              mode="edit"
                              warranty={{
                                id: w.id,
                                customerId: w.customer.id,
                                productName: w.productName,
                                color: w.color,
                                size: w.size,
                                purchaseChannel: w.purchaseChannel,
                                purchaseDate: w.purchaseDate ? w.purchaseDate.toISOString() : null,
                                warrantyExpiry: w.warrantyExpiry ? w.warrantyExpiry.toISOString() : null,
                                warrantyCode: w.warrantyCode,
                                status: w.status,
                                notes: w.notes,
                              }}
                              customers={customerOptions}
                              action={updateWarrantyAction.bind(null, w.id)}
                            />
                          )}
                          {canDelete && (
                            <ConfirmDeleteButton
                              title="Xoá bảo hành"
                              description={`Xoá bảo hành "${w.warrantyCode}" — không thể hoàn tác.`}
                              onConfirm={deleteWarrantyAction.bind(null, w.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}
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
