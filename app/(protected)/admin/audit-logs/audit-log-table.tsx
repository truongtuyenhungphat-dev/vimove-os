"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  timeLabel: string;
};

function actionBadgeClass(action: string) {
  if (action.endsWith(".delete") || action.includes("deactivate") || action.includes("cancel") || action.includes("remove"))
    return "bg-destructive/10 text-destructive";
  if (action.endsWith(".create") || action.includes("activate") || action.includes("add"))
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (action.endsWith(".update") || action.includes("change") || action.includes("assign"))
    return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

/** Nhật ký audit — tìm kiếm + lọc loại đối tượng ngay trên client (danh sách đã giới hạn
 * 100 dòng gần nhất từ service, tải hết sẵn nên không cần round-trip server). */
export function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");

  const entityTypes = useMemo(() => Array.from(new Set(logs.map((l) => l.entityType))).sort(), [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (entityType !== "all" && l.entityType !== entityType) return false;
      if (q && !l.action.toLowerCase().includes(q) && !l.actorName.toLowerCase().includes(q) && !l.entityType.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [logs, search, entityType]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo hành động, người thực hiện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 pl-8"
            />
          </div>
          <Select
            items={[{ value: "all", label: "Tất cả đối tượng" }, ...entityTypes.map((t) => ({ value: t, label: t }))]}
            value={entityType}
            onValueChange={(v) => setEntityType(v ?? "all")}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Đối tượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đối tượng</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length}/{logs.length} bản ghi gần nhất
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={logs.length === 0 ? "Chưa có hoạt động nào được ghi nhận" : "Không tìm thấy bản ghi phù hợp"}
            description={logs.length > 0 ? "Thử đổi từ khoá hoặc bộ lọc." : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="hidden sm:table-cell">Người thực hiện</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead className="hidden md:table-cell">Đối tượng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{log.timeLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell">{log.actorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-transparent font-mono text-xs font-normal", actionBadgeClass(log.action))}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {log.entityType} · {log.entityId.slice(0, 8)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
