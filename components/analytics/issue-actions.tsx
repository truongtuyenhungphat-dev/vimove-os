"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IssueActions({ issueId, onResolve }: { issueId: string; onResolve: (issueId: string, status: "RESOLVED" | "IGNORED") => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  function handle(status: "RESOLVED" | "IGNORED") {
    startTransition(async () => {
      try {
        await onResolve(issueId, status);
        toast.success(status === "RESOLVED" ? "Đã đánh dấu xử lý" : "Đã bỏ qua");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => handle("RESOLVED")}>
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
        Đã xử lý
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => handle("IGNORED")}>
        <EyeOff aria-hidden="true" />
        Bỏ qua
      </Button>
    </div>
  );
}
