import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/process/types";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  PLANNING: "bg-muted text-muted-foreground",
  ACTIVE: "bg-primary/10 text-primary",
  ON_HOLD: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-normal", STATUS_STYLE[status], className)}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
