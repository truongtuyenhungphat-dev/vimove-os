"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMAIL_CAMPAIGN_STATUSES, EMAIL_CAMPAIGN_STATUS_LABELS, type EmailCampaignStatus } from "@/lib/marketing/types";

export function EmailStatusSelect({
  emailId,
  status,
  onChange,
}: {
  emailId: string;
  status: EmailCampaignStatus;
  onChange: (emailId: string, status: EmailCampaignStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      items={EMAIL_CAMPAIGN_STATUS_LABELS}
      value={status}
      disabled={isPending}
      onValueChange={(v) => {
        startTransition(async () => {
          try {
            await onChange(emailId, v as EmailCampaignStatus);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EMAIL_CAMPAIGN_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {EMAIL_CAMPAIGN_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
