"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Users2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setTeamMembersAction } from "./actions";

type UserOption = { id: string; name: string; email: string };

export function TeamMembersDialog({
  teamId,
  teamName,
  users,
  currentMemberIds,
}: {
  teamId: string;
  teamName: string;
  users: UserOption[];
  currentMemberIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentMemberIds));
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      ),
    [users, query]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await setTeamMembersAction(teamId, Array.from(selected));
        toast.success("Đã cập nhật thành viên nhóm");
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
        if (v) setSelected(new Set(currentMemberIds));
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Quản lý thành viên ${teamName}`} />}>
        <Users2 className="size-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thành viên — {teamName}</DialogTitle>
          <DialogDescription>Chọn người dùng thuộc nhóm này.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Tìm theo tên hoặc email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="max-h-72 overflow-y-auto rounded-md border border-border">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy người dùng</p>
          )}
          {filtered.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-accent"
            >
              <Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggle(u.id)} />
              <span className="flex-1">
                <span className="font-medium">{u.name}</span>{" "}
                <span className="text-muted-foreground">— {u.email}</span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isPending ? "Đang lưu..." : `Lưu (${selected.size} thành viên)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
