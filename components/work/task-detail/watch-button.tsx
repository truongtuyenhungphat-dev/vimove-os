"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WatchButton({
  watching: initialWatching,
  onToggle,
}: {
  watching: boolean;
  onToggle: () => Promise<{ watching: boolean }>;
}) {
  const [watching, setWatching] = useState(initialWatching);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await onToggle();
            setWatching(result.watching);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
          }
        })
      }
    >
      {watching ? <EyeOff /> : <Eye />}
      {watching ? "Bỏ theo dõi" : "Theo dõi"}
    </Button>
  );
}
