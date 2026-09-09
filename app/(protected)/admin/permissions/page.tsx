import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { listPermissions } from "@/services/core/roles";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Quyền hạn — VIMOVE OS" };

export default async function PermissionsPage() {
  await requirePermission("roles.read");
  const permissions = await listPermissions();

  return (
    <>
      <PageHeader
        title="Danh mục quyền hạn"
        description="Toàn bộ permission dạng resource.action trong hệ thống (chỉ đọc — gán quyền tại trang Vai trò)"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Mô tả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.key}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.resource}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.action}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
