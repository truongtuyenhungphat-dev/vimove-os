import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { listProducts } from "@/services/sales/products";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductDialog } from "@/components/sales/product-dialog";
import { createProductAction, updateProductAction, deleteProductAction } from "./actions";

export const metadata: Metadata = { title: "Sản phẩm — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function ProductsPage() {
  const session = await requirePermission("sales_catalog.manage");
  const products = await listProducts(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Sản phẩm"
        description="Danh mục sản phẩm dùng để lên đơn hàng"
        actions={<ProductDialog mode="create" action={createProductAction} />}
      />

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Package} title="Chưa có sản phẩm nào" description="Thêm sản phẩm đầu tiên để bắt đầu tạo đơn hàng." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku ?? "—"}</TableCell>
                    <TableCell>{formatVnd(p.price)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.unit ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.isActive ? "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-transparent bg-muted text-muted-foreground"}>
                        {p.isActive ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ProductDialog mode="edit" product={p} action={updateProductAction.bind(null, p.id)} />
                        <ConfirmDeleteButton
                          title="Xoá sản phẩm"
                          description={`Xoá sản phẩm "${p.name}" — không thể hoàn tác.`}
                          onConfirm={deleteProductAction.bind(null, p.id)}
                        />
                      </div>
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
