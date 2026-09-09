"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PIPELINE_STAGE_TYPE_LABELS, type PipelineStageType } from "@/lib/crm/types";

type StageRow = { name: string; type: PipelineStageType };

const DEFAULT_STAGES: StageRow[] = [
  { name: "Mới", type: "OPEN" },
  { name: "Đã liên hệ", type: "OPEN" },
  { name: "Đạt yêu cầu", type: "OPEN" },
  { name: "Báo giá", type: "OPEN" },
  { name: "Đàm phán", type: "OPEN" },
  { name: "Thắng", type: "WON" },
  { name: "Thua", type: "LOST" },
];

export function PipelineCreateDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [stages, setStages] = useState<StageRow[]>(DEFAULT_STAGES);

  function updateStage(index: number, patch: Partial<StageRow>) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function handleSubmit(formData: FormData) {
    const valid = stages.filter((s) => s.name.trim());
    if (valid.length === 0) {
      toast.error("Cần ít nhất 1 giai đoạn");
      return;
    }
    formData.set("stagesJson", JSON.stringify(valid));
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã tạo pipeline");
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
        if (v) setStages(DEFAULT_STAGES);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Tạo pipeline
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo pipeline</DialogTitle>
          <DialogDescription>Mặc định theo NEW→CONTACTED→QUALIFIED→OFFER→NEGOTIATION→WON/LOST — có thể sửa lại.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pipeline-name">Tên pipeline</Label>
            <Input id="pipeline-name" name="name" placeholder="Pipeline bán hàng" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Giai đoạn</Label>
            <div className="flex flex-col gap-2">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={stage.name}
                    onChange={(e) => updateStage(i, { name: e.target.value })}
                    className="h-8 flex-1"
                  />
                  <Select items={PIPELINE_STAGE_TYPE_LABELS} value={stage.type} onValueChange={(v) => updateStage(i, { type: v as PipelineStageType })}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["OPEN", "WON", "LOST"] as PipelineStageType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {PIPELINE_STAGE_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá giai đoạn ${i + 1}`}
                    onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setStages((prev) => [...prev, { name: "", type: "OPEN" }])}
              >
                <Plus /> Thêm giai đoạn
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Tạo pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
