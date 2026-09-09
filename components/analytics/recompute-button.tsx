"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecomputeButton({ action }: { action: () => Promise<number> }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const days = await action();
        toast.success(`Đã tính lại số liệu cho ${days} ngày`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
      Tính lại số liệu
    </Button>
  );
}
