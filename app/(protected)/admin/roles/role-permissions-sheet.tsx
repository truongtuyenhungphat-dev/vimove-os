"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateRolePermissionsAction } from "./actions";
import { SCOPABLE_PERMISSIONS, type PermissionKey } from "@/lib/permissions/catalog";

type Permission = { id: string; key: string; resource: string; action: string; description: string | null };
type Scope = "ALL" | "DEPARTMENT" | "OWN";

const SCOPE_ITEMS: Record<Scope, string> = {
  ALL: "Toàn tổ chức",
  DEPARTMENT: "Chỉ phòng ban của user",
  OWN: "Chỉ của chính user",
};

export function RolePermissionsSheet({
  roleId,
  roleName,
  permissionsByResource,
  currentPermissions,
  disabled,
}: {
  roleId: string;
  roleName: string;
  permissionsByResource: [string, Permission[]][];
  currentPermissions: { permissionId: string; scope: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Map<string, Scope>>(
    new Map(currentPermissions.map((p) => [p.permissionId, p.scope as Scope]))
  );
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, "ALL");
      return next;
    });
  }

  function setScope(id: string, scope: Scope) {
    setSelected((prev) => new Map(prev).set(id, scope));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const payload = Array.from(selected.entries()).map(([permissionId, scope]) => ({ permissionId, scope }));
        await updateRolePermissionsAction(roleId, payload);
        toast.success("Đã cập nhật quyền của vai trò");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setSelected(new Map(currentPermissions.map((p) => [p.permissionId, p.scope as Scope])));
      }}
    >
      <SheetTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        <ShieldPlus className="size-4" /> Sửa quyền
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Quyền của vai trò — {roleName}</SheetTitle>
          <SheetDescription>
            Chọn các permission thuộc vai trò này. Với quyền có thể thu hẹp phạm vi (đánh dấu *),
            chọn thêm mức &quot;thấy gì&quot; — mặc định Toàn tổ chức.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {permissionsByResource.map(([resource, permissions]) => (
            <div key={resource} className="mb-4">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {resource}
              </p>
              <div className="flex flex-col gap-1">
                {permissions.map((p) => {
                  const isScopable = SCOPABLE_PERMISSIONS.includes(p.key as PermissionKey);
                  const checked = selected.has(p.id);
                  return (
                    <div key={p.id} className="rounded px-1.5 py-1 hover:bg-accent">
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} className="mt-0.5" />
                        <span>
                          <span className="font-medium">
                            {p.key}
                            {isScopable && " *"}
                          </span>
                          {p.description && <span className="block text-xs text-muted-foreground">{p.description}</span>}
                        </span>
                      </label>
                      {isScopable && checked && (
                        <div className="ml-6 mt-1">
                          <Select
                            items={SCOPE_ITEMS}
                            value={selected.get(p.id) ?? "ALL"}
                            onValueChange={(v) => setScope(p.id, v as Scope)}
                          >
                            <SelectTrigger size="sm" className="h-7 w-48 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(SCOPE_ITEMS) as [Scope, string][]).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
