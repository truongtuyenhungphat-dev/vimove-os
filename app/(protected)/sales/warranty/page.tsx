import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, AlarmClock, Wrench } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listWarranties, getWarrantySummary } from "@/services/warranty/warranties";
import { listCustomers } from "@/services/crm/customers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarrantyDialog } from "@/components/sales/warranty-dialog";
import { WarrantyFilterBar } from "@/components/sales/warranty-filter-bar";
import { WARRANTY_STATUS_LABELS, WARRANTY_STATUSES, type WarrantyStatus } from "@/lib/warranty/types";
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
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const session = await requirePermission("warranty.read");
  const canCreate = hasPermission(session, "warranty.create");
  const canUpdate = hasPermission(session, "warranty.update");
  const canDelete = hasPermission(session, "warranty.delete");
  const { search, status } = await searchParams;
  const activeStatus = status && (WARRANTY_STATUSES as string[]).includes(status) ? (status as WarrantyStatus) : undefined;

  const [warranties, customers, summary] = await Promise.all([
    listWarranties(session.user.organizationId, { search, status: activeStatus }),
    listCustomers(session.user.organizationId),
    getWarrantySummary(session.user.organizationId),
  ]);
  const customerOptions = customers.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Bảo hành"
        description="Đăng ký và theo dõi bảo hành sản phẩm theo khách hàng"
        actions={canCreate ? <WarrantyDialog mode="create" customers={customerOptions} action={createWarrantyAction} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Tổng bảo hành" value={summary.total} icon={BadgeCheck} tone="muted" />
        <KpiCard label="Còn hạn" value={summary.active} icon={ShieldCheck} tone="primary" />
        <KpiCard label="Sắp hết hạn (30 ngày)" value={summary.expiringSoon} icon={AlarmClock} tone={summary.expiringSoon > 0 ? "warning" : "muted"} />
        <KpiCard label="Đã bảo hành" value={summary.claimed} icon={Wrench} tone="muted" />
      </div>

      <WarrantyFilterBar />

      <Card>
        <CardContent className="p-0">
          {warranties.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={BadgeCheck}
                title={search || activeStatus ? "Không tìm thấy bảo hành nào" : "Chưa có bảo hành nào"}
                description={search || activeStatus ? "Thử từ khoá hoặc bộ lọc khác." : "Đăng ký bảo hành đầu tiên để bắt đầu theo dõi."}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã bảo hành</TableHead>
                  <TableHead className="hidden sm:table-cell">Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="hidden sm:table-cell">Kênh mua</TableHead>
                  <TableHead className="hidden sm:table-cell">Hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      {w.warrantyCode}
                      {/* Khách hàng + hạn dùng gộp vào đây trên mobile — 3 cột
                       * (Khách hàng/Kênh mua/Hết hạn) bị ẩn dưới sm: để bảng
                       * không tràn ngang trên màn hình hẹp (phát hiện thật khi
                       * test 414px, 7 cột không đủ chỗ). */}
                      <p className="text-xs font-normal text-muted-foreground sm:hidden">
                        {w.customer.name} · hết hạn {fmtDate(w.warrantyExpiry)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
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
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{w.purchaseChannel ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{fmtDate(w.warrantyExpiry)}</TableCell>
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
