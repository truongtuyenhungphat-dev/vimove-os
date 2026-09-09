import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, type TaskStatus, type TaskPriority } from "@/lib/work/types";

const STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  IN_REVIEW: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-normal", STATUS_STYLE[status], className)}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  URGENT: "bg-destructive/10 text-destructive",
};

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-normal", PRIORITY_STYLE[priority], className)}>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
