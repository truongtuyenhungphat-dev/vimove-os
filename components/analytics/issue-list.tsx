import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { IssueActions } from "./issue-actions";
import { DATA_QUALITY_TYPE_LABELS, DATA_QUALITY_SEVERITY_LABELS, type DataQualitySeverity, type DataQualityIssueType } from "@/lib/analytics/types";

const SEVERITY_STYLE: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HIGH: "bg-destructive/10 text-destructive",
};

export type DataQualityIssueItem = {
  id: string;
  type: DataQualityIssueType;
  severity: DataQualitySeverity;
  description: string;
  detectedAt: string;
  status: "OPEN" | "RESOLVED" | "IGNORED";
};

export function IssueList({
  items,
  canManage,
  onResolve,
}: {
  items: DataQualityIssueItem[];
  canManage: boolean;
  onResolve: (issueId: string, status: "RESOLVED" | "IGNORED") => Promise<void>;
}) {
  if (items.length === 0) return <EmptyState icon={ShieldAlert} title="Không có issue nào" />;
  return (
    <div className="flex flex-col gap-2">
      {items.map((issue) => (
        <div key={issue.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-transparent bg-muted font-normal">
                {DATA_QUALITY_TYPE_LABELS[issue.type]}
              </Badge>
              <Badge variant="outline" className={`border-transparent font-normal ${SEVERITY_STYLE[issue.severity]}`}>
                {DATA_QUALITY_SEVERITY_LABELS[issue.severity]}
              </Badge>
            </div>
            <p>{issue.description}</p>
            <p className="text-xs text-muted-foreground">Phát hiện: {new Date(issue.detectedAt).toLocaleString("vi-VN")}</p>
          </div>
          {canManage && issue.status === "OPEN" && <IssueActions issueId={issue.id} onResolve={onResolve} />}
        </div>
      ))}
    </div>
  );
}
