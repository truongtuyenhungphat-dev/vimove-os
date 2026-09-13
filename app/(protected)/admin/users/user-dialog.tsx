"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Option = { id: string; name: string };

export function UserDialog({
  mode,
  user,
  departments,
  roles,
  action,
}: {
  mode: "create" | "edit";
  user?: {
    id: string;
    email: string;
    name: string;
    title: string | null;
    departmentId: string | null;
    roleIds: string[];
  };
  departments: Option[];
  roles: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(user?.roleIds ?? []));

  function toggleRole(id: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    for (const roleId of selectedRoles) formData.append("roleIds", roleId);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo người dùng" : "Đã cập nhật người dùng");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setSelectedRoles(new Set(user?.roleIds ?? []));
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo người dùng
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa ${user?.email}`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo người dùng" : "Sửa người dùng"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Tạo tài khoản mới trong tổ chức." : `Cập nhật thông tin cho ${user?.email}.`}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-name">Họ tên</Label>
              <Input id="user-name" name="name" defaultValue={user?.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-title">Chức danh</Label>
              <Input id="user-title" name="title" defaultValue={user?.title ?? ""} />
            </div>
          </div>

          {mode === "create" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-password">Mật khẩu tạm thời</Label>
                <Input id="user-password" name="password" type="password" required minLength={8} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-department">Phòng ban</Label>
            <Select
              name="departmentId"
              items={departments.map((d) => ({ value: d.id, label: d.name }))}
              defaultValue={user?.departmentId ?? undefined}
            >
              <SelectTrigger id="user-department" className="w-full">
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Vai trò</Label>
            <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border p-2">
              {roles.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                  <Checkbox checked={selectedRoles.has(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
