"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ScanSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanButton({ action }: { action: () => Promise<{ foundCount: number; resolvedCount: number }> }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await action();
        toast.success(`Quét xong: ${result.foundCount} issue đang mở, ${result.resolvedCount} issue tự đóng`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ScanSearch aria-hidden="true" />}
      Quét lại
    </Button>
  );
}
