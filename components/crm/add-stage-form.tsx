"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIPELINE_STAGE_TYPE_LABELS, type PipelineStageType } from "@/lib/crm/types";

export function AddStageForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<PipelineStageType>("OPEN");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    startTransition(async () => {
      try {
        await action(formData);
        formRef.current?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-center gap-1.5">
      <Input name="name" placeholder="Tên giai đoạn mới" className="h-8 flex-1" required />
      <Select items={PIPELINE_STAGE_TYPE_LABELS} value={type} onValueChange={(v) => setType(v as PipelineStageType)}>
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
      <Button type="submit" size="icon-sm" variant="outline" disabled={isPending} aria-label="Thêm giai đoạn">
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      </Button>
    </form>
  );
}
