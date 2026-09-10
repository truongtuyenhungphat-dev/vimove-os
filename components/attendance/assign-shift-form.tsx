"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AssignShiftForm({
  users,
  shifts,
  action,
}: {
  users: { id: string; name: string }[];
  shifts: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const shiftItems = Object.fromEntries(shifts.map((s) => [s.id, s.name]));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã xếp ca");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  if (users.length === 0 || shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">Cần có ít nhất 1 ca làm việc và 1 nhân sự để xếp ca.</p>;
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <Select items={userItems} name="userId" value={userId} onValueChange={(v) => setUserId(v as string)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Nhân sự" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Select items={shiftItems} name="shiftId" value={shiftId} onValueChange={(v) => setShiftId(v as string)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ca" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input name="date" type="date" required className="w-40" />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Xếp ca
      </Button>
    </form>
  );
}
