"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MARKETING_CHANNEL_TYPES, MARKETING_CHANNEL_TYPE_LABELS, type MarketingChannelType } from "@/lib/marketing/types";

export function AddChannelForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<MarketingChannelType>("FACEBOOK");
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
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-center gap-1.5">
      <Select items={MARKETING_CHANNEL_TYPE_LABELS} value={type} onValueChange={(v) => setType(v as MarketingChannelType)}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MARKETING_CHANNEL_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {MARKETING_CHANNEL_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="plannedBudget" type="number" min={0} step={100000} placeholder="Ngân sách dự kiến" className="h-8 w-40" />
      <Button type="submit" size="icon-sm" variant="outline" disabled={isPending} aria-label="Thêm kênh">
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      </Button>
    </form>
  );
}
