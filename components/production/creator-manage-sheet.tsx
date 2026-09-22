"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreatorData = { id: string; user: { id: string; name: string } };
type UserOption = { id: string; name: string };

export function CreatorManageSheet({
  creators,
  availableUsers,
  canManage,
  onAdd,
  onRemove,
}: {
  creators: CreatorData[];
  availableUsers: UserOption[];
  canManage: boolean;
  onAdd: (userId: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  const rosterIds = new Set(creators.map((c) => c.user.id));
  const pickable = availableUsers.filter((u) => !rosterIds.has(u.id));
  const items = Object.fromEntries(pickable.map((u) => [u.id, u.name]));

  function addSelected() {
    if (!selected) return;
    startTransition(async () => {
      try {
        await onAdd(selected);
        setSelected("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Users /> Quản lý thành viên
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Thành viên đội content</SheetTitle>
          <SheetDescription>Chọn từ danh sách nhân sự có sẵn — người được thêm sẽ xuất hiện trên bảng đếm tiến độ.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {creators.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>}
          {creators.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
              <span className="text-sm font-medium">{c.user.name}</span>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Bỏ "${c.user.name}"`}
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await onRemove(c.id);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
                      }
                    })
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}

          {canManage && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
              <Select items={items} value={selected} onValueChange={(value) => setSelected(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={pickable.length ? "Chọn nhân sự…" : "Không còn ai để thêm"} />
                </SelectTrigger>
                <SelectContent>
                  {pickable.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addSelected} disabled={isPending || !selected}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Thêm vào đội
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
