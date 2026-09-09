"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AI_RECOMMENDATION_STATUS_LABELS, AI_ACTION_STATUS_LABELS, type AiRecommendationStatus, type AiActionStatus } from "@/lib/ai/types";

export type RecommendationItem = {
  id: string;
  title: string;
  description: string;
  status: AiRecommendationStatus;
  createdAt: string;
  action: {
    status: AiActionStatus;
    resultMessage: string | null;
    approvedBy: { name: string };
    logs: { id: string; message: string; createdAt: string }[];
  } | null;
};

const STATUS_STYLE: Record<AiRecommendationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  REJECTED: "bg-muted text-muted-foreground",
  EXECUTED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function RecommendationCard({
  item,
  canManage,
  onApprove,
  onReject,
}: {
  item: RecommendationItem;
  canManage: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handle(fn: (id: string) => Promise<void>) {
    startTransition(async () => {
      try {
        await fn(item.id);
        toast.success("Đã xử lý");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-6 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{item.title}</p>
          <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[item.status]}`}>
            {AI_RECOMMENDATION_STATUS_LABELS[item.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground">{item.description}</p>

        {item.action && (
          <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2 text-xs">
            <p>
              Duyệt bởi {item.action.approvedBy.name} · Kết quả:{" "}
              <span className={item.action.status === "SUCCEEDED" ? "text-emerald-600 dark:text-emerald-400" : item.action.status === "FAILED" ? "text-destructive" : ""}>
                {AI_ACTION_STATUS_LABELS[item.action.status]}
              </span>
            </p>
            {item.action.resultMessage && <p>{item.action.resultMessage}</p>}
            {item.action.logs.map((log) => (
              <p key={log.id} className="text-muted-foreground">
                {new Date(log.createdAt).toLocaleTimeString("vi-VN")} — {log.message}
              </p>
            ))}
          </div>
        )}

        {canManage && item.status === "PENDING" && (
          <div className="flex justify-end gap-1.5">
            <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={isPending} onClick={() => handle(onReject)}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}
              Từ chối
            </Button>
            <Button type="button" size="sm" disabled={isPending} onClick={() => handle(onApprove)}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              Duyệt & thực thi
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
