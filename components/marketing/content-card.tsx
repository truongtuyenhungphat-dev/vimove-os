import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTENT_TYPE_LABELS, type ContentType } from "@/lib/marketing/types";
import { cn } from "@/lib/utils";

export type ContentCardData = {
  id: string;
  title: string;
  type: ContentType;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  campaign: { id: string; name: string } | null;
};

export function ContentCard({ content, href, dragging }: { content: ContentCardData; href?: string; dragging?: boolean }) {
  const body = (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-60 shadow-lg"
      )}
    >
      <p className="leading-snug font-medium">{content.title}</p>
      {content.campaign && <p className="text-xs text-muted-foreground">{content.campaign.name}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {CONTENT_TYPE_LABELS[content.type]}
        </span>
        {content.assignee && (
          <Avatar size="sm">
            <AvatarImage src={content.assignee.avatarUrl ?? undefined} />
            <AvatarFallback>{content.assignee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>
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
