"use client";

import { useMemo, useState } from "react";
import { Search, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export type PermissionRow = { id: string; key: string; resource: string; action: string; description: string | null };

/** Danh mục quyền hạn — tìm kiếm client-side + gom nhóm theo resource, dữ liệu tĩnh nhỏ
 * (≈70 dòng) đã tải hết sẵn nên không cần round-trip server. */
export function PermissionsTable({ permissions }: { permissions: PermissionRow[] }) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? permissions.filter(
          (p) =>
            p.key.toLowerCase().includes(q) ||
            p.resource.toLowerCase().includes(q) ||
            p.action.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q)
        )
      : permissions;
    const map = new Map<string, PermissionRow[]>();
    for (const p of filtered) {
      const arr = map.get(p.resource) ?? [];
      arr.push(p);
      map.set(p.resource, arr);
    }
    return Array.from(map.entries());
  }, [permissions, search]);

  const totalShown = grouped.reduce((sum, [, rows]) => sum + rows.length, 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo key, resource, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 pl-8"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {totalShown}/{permissions.length} quyền · {grouped.length} resource
          </span>
        </div>

        {totalShown === 0 ? (
          <EmptyState icon={KeyRound} title="Không tìm thấy quyền phù hợp" description="Thử đổi từ khoá." />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(([resource, rows]) => (
              <div key={resource} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">{resource}</Badge>
                  <span className="text-xs text-muted-foreground">{rows.length} quyền</span>
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.key}</TableCell>
                          <TableCell className="text-muted-foreground">{p.action}</TableCell>
                          <TableCell className="text-muted-foreground">{p.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
