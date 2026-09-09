"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateInsightsButton({ action }: { action: () => Promise<number> }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const count = await action();
        toast.success(count > 0 ? `Đã phát hiện ${count} insight mới` : "Không phát hiện vấn đề nào");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      Tạo insight mới
    </Button>
  );
}
