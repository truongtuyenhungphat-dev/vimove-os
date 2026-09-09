"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RequestApprovalDialog({
  taskTitle,
  users,
  onSubmit,
}: {
  taskTitle: string;
  users: { id: string; name: string }[];
  onSubmit: (data: { mode: "SEQUENTIAL" | "PARALLEL"; slaHours: number | null; approverIds: string[] }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"SEQUENTIAL" | "PARALLEL">("SEQUENTIAL");
  const [slaHours, setSlaHours] = useState("24");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit() {
    if (selected.length === 0) {
      toast.error("Cần chọn ít nhất 1 người duyệt");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit({ mode, slaHours: slaHours ? Number(slaHours) : null, approverIds: selected });
        toast.success("Đã gửi yêu cầu duyệt");
        setOpen(false);
        setSelected([]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShieldCheck aria-hidden="true" /> Yêu cầu duyệt
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yêu cầu duyệt</DialogTitle>
          <DialogDescription>Tạo yêu cầu duyệt cho &quot;{taskTitle}&quot; — hiện ở Approval Hub.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Người duyệt</Label>
            <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border p-2">
              {users.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                  <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
                  {u.name}
                </label>
              ))}
            </div>
            {mode === "SEQUENTIAL" && selected.length > 1 && (
              <p className="text-xs text-muted-foreground">Tuần tự theo thứ tự chọn: {selected.map((id) => users.find((u) => u.id === id)?.name).join(" → ")}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="approval-mode">Chế độ duyệt</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "SEQUENTIAL" | "PARALLEL")}>
                <SelectTrigger id="approval-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">Tuần tự</SelectItem>
                  <SelectItem value="PARALLEL">Song song</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="approval-sla">SLA (giờ)</Label>
              <Input id="approval-sla" type="number" min={1} value={slaHours} onChange={(e) => setSlaHours(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
