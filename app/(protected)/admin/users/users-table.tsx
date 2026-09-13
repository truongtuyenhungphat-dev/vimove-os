"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { UserStatus } from "@/app/generated/prisma/enums";

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Đã vô hiệu hoá",
  INVITED: "Đã mời, chưa vào",
};

const STATUS_BADGE_CLASS: Record<UserStatus, string> = {
  ACTIVE: "border-transparent bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400",
  INACTIVE: "border-transparent bg-muted font-normal text-muted-foreground",
  INVITED: "border-transparent bg-amber-500/10 font-normal text-amber-600 dark:text-amber-400",
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  title: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: UserStatus;
  roleNames: string[];
  actions: ReactNode;
};

/** Bảng người dùng — tìm kiếm + lọc phòng ban/trạng thái ngay trên client (danh sách nội
 * bộ tổ chức, đã tải hết sẵn, không cần round-trip server). */
export function UsersTable({
  users,
  departments,
}: {
  users: UserRow[];
  departments: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (departmentId !== "all" && u.departmentId !== departmentId) return false;
      if (status !== "all" && u.status !== status) return false;
      return true;
    });
  }, [users, search, departmentId, status]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 pl-8"
            />
          </div>
          <Select
            items={[{ value: "all", label: "Tất cả phòng ban" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
            value={departmentId}
            onValueChange={(v) => setDepartmentId(v ?? "all")}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "ACTIVE", label: STATUS_LABELS.ACTIVE },
              { value: "INVITED", label: STATUS_LABELS.INVITED },
              { value: "INACTIVE", label: STATUS_LABELS.INACTIVE },
            ]}
            value={status}
            onValueChange={(v) => setStatus(v ?? "all")}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">{STATUS_LABELS.ACTIVE}</SelectItem>
              <SelectItem value="INVITED">{STATUS_LABELS.INVITED}</SelectItem>
              <SelectItem value="INACTIVE">{STATUS_LABELS.INACTIVE}</SelectItem>
            </SelectContent>
          </Select>
          {(search || departmentId !== "all" || status !== "all") && (
            <span className="text-xs text-muted-foreground">{filtered.length}/{users.length} người dùng</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={users.length === 0 ? "Chưa có người dùng nào" : "Không tìm thấy người dùng phù hợp"}
            description={users.length === 0 ? "Tạo tài khoản đầu tiên để bắt đầu." : "Thử đổi từ khoá hoặc bộ lọc."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="hidden sm:table-cell">Phòng ban</TableHead>
                  <TableHead className="hidden md:table-cell">Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarImage src={u.avatarUrl ?? undefined} />
                          <AvatarFallback>{u.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{u.departmentName ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {u.roleNames.length === 0 ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          u.roleNames.map((name) => (
                            <Badge key={name} variant="secondary" className="font-normal">
                              {name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE_CLASS[u.status]}>
                        {STATUS_LABELS[u.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">{u.actions}</div>
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
