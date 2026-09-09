import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LEAD_SOURCE_LABELS } from "@/lib/crm/types";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@/lib/crm/types";

export type LeadCardData = {
  id: string;
  name: string;
  contactName: string | null;
  value: number | null;
  source: LeadSource;
  owner: { id: string; name: string; avatarUrl: string | null } | null;
};

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function LeadCard({ lead, href, dragging }: { lead: LeadCardData; href?: string; dragging?: boolean }) {
  const body = (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-60 shadow-lg"
      )}
    >
      <p className="leading-snug font-medium">{lead.name}</p>
      {lead.contactName && <p className="text-xs text-muted-foreground">{lead.contactName}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {LEAD_SOURCE_LABELS[lead.source]}
        </span>
        {lead.owner && (
          <Avatar size="sm">
            <AvatarImage src={lead.owner.avatarUrl ?? undefined} />
            <AvatarFallback>{lead.owner.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>
      {lead.value !== null && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{formatVnd(lead.value)}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
