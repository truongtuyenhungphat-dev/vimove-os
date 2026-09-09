"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewConversationButton({ action }: { action: () => Promise<string> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const id = await action();
        router.push(`/ai/assistant?c=${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Button type="button" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MessageSquarePlus aria-hidden="true" />}
      Hội thoại mới
    </Button>
  );
}
