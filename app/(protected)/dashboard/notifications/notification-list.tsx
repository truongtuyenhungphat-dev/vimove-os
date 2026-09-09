"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { markReadAction } from "./actions";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="flex flex-col divide-y divide-border">
      {notifications.map((n) => (
        <li key={n.id} className={cn("flex items-start justify-between gap-4 py-3", !n.readAt && "bg-accent/40 -mx-4 px-4")}>
          <div>
            <p className="text-sm font-medium">{n.title}</p>
            {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
            <p className="mt-1 text-xs text-muted-foreground/70">
              {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: vi })}
            </p>
          </div>
          {!n.readAt && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(() => markReadAction(n.id))}
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
