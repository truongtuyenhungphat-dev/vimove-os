"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIAL_POST_STATUSES, SOCIAL_POST_STATUS_LABELS, type SocialPostStatus } from "@/lib/marketing/types";

export function SocialPostStatusSelect({
  postId,
  status,
  onChange,
}: {
  postId: string;
  status: SocialPostStatus;
  onChange: (postId: string, status: SocialPostStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      items={SOCIAL_POST_STATUS_LABELS}
      value={status}
      disabled={isPending}
      onValueChange={(v) => {
        startTransition(async () => {
          try {
            await onChange(postId, v as SocialPostStatus);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SOCIAL_POST_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {SOCIAL_POST_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
