import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MessageSquare, CheckSquare, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskPriorityBadge } from "./task-badges";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/work/types";

export type TaskCardData = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueAt: Date | string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  _count: { comments: number; checklistItems: number; attachments: number };
};

export function TaskCard({
  task,
  href,
  dragging,
  now,
}: {
  task: TaskCardData;
  href?: string;
  dragging?: boolean;
  /** Truyền từ Server Component (kanban/page.tsx) — tránh gọi `Date.now()` không thuần
   * trong thân component (React Compiler purity rule). */
  now: Date;
}) {
  const dueDate = task.dueAt ? new Date(task.dueAt) : null;
  const overdue = dueDate ? dueDate.getTime() < now.getTime() : false;

  const body = (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-60 shadow-lg"
      )}
    >
      <p className="leading-snug font-medium">{task.title}</p>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          {dueDate && (
            <span
              className={cn("flex items-center gap-1 text-xs text-muted-foreground", overdue && "text-destructive")}
            >
              <Calendar className="size-3" />
              {format(dueDate, "dd/MM")}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar size="sm">
            <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
            <AvatarFallback>{task.assignee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {(task._count.checklistItems > 0 || task._count.comments > 0 || task._count.attachments > 0) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task._count.checklistItems > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="size-3" /> {task._count.checklistItems}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" /> {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="size-3" /> {task._count.attachments}
            </span>
          )}
        </div>
      )}
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
