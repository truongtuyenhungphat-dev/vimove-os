"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LEAVE_TYPE_LABELS } from "@/lib/attendance/types";
import type { LeaveType } from "@/lib/attendance/types";

export function LeaveRequestDialog({
  approvers,
  action,
}: {
  approvers: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>("ANNUAL");
  const [selectedApprovers, setSelectedApprovers] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggleApprover(id: string) {
    setSelectedApprovers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    for (const id of selectedApprovers) formData.append("approverIds", id);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã gửi đơn nghỉ phép");
        setOpen(false);
        setSelectedApprovers(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus aria-hidden="true" /> Tạo đơn nghỉ phép
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn nghỉ phép</DialogTitle>
          <DialogDescription>Gửi đi sẽ tạo yêu cầu duyệt thật ở Approval Hub, đúng luồng duyệt tuần tự.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-type">Loại nghỉ</Label>
            <Select items={LEAVE_TYPE_LABELS} name="type" value={type} onValueChange={(v) => setType(v as LeaveType)}>
              <SelectTrigger id="leave-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-start">Từ ngày</Label>
              <Input id="leave-start" name="startDate" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-end">Đến ngày</Label>
              <Input id="leave-end" name="endDate" type="date" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-reason">Lý do</Label>
            <Textarea id="leave-reason" name="reason" placeholder="Không bắt buộc" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Người duyệt</Label>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-input p-2">
              {approvers.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                  <Checkbox checked={selectedApprovers.has(a.id)} onCheckedChange={() => toggleApprover(a.id)} />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || selectedApprovers.size === 0}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Gửi đơn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
