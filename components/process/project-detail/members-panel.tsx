"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type MemberItem = { userId: string; name: string; role: string };

export function MembersPanel({
  ownerId,
  members,
  candidateUsers,
  canEdit,
  onAdd,
  onRemove,
}: {
  ownerId: string;
  members: MemberItem[];
  candidateUsers: { id: string; name: string }[];
  canEdit: boolean;
  onAdd: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <Avatar size="sm">
              <AvatarFallback>{m.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm">{m.name}</span>
            <Badge variant="outline" className="font-normal">
              {m.role === "OWNER" ? "Chủ dự án" : m.role === "VIEWER" ? "Chỉ xem" : "Thành viên"}
            </Badge>
            {canEdit && m.userId !== ownerId && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label={`Gỡ ${m.name} khỏi dự án`}
                onClick={() => startTransition(async () => onRemove(m.userId))}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {canEdit && candidateUsers.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Select value={selected} onValueChange={(v) => setSelected(String(v))}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Thêm thành viên..." />
            </SelectTrigger>
            <SelectContent>
              {candidateUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" disabled={isPending || !selected} onClick={handleAdd}>
            <Plus aria-hidden="true" /> Thêm
          </Button>
        </div>
      )}
    </div>
  );
}
