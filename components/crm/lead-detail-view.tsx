"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MANUAL_LEAD_ACTIVITY_TYPES,
  LEAD_ACTIVITY_TYPE_LABELS,
  PIPELINE_STAGE_TYPE_LABELS,
  type LeadActivityType,
  type PipelineStageType,
} from "@/lib/crm/types";

export type LeadActivityItem = {
  id: string;
  type: LeadActivityType;
  content: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

export type StageOption = { id: string; name: string; type: PipelineStageType };

export function LeadDetailView({
  leadId,
  stageId,
  stages,
  activities,
  canConvert,
  canUpdate,
  onMoveStage,
  onAddActivity,
  onConvert,
}: {
  leadId: string;
  stageId: string;
  stages: StageOption[];
  activities: LeadActivityItem[];
  canConvert: boolean;
  canUpdate: boolean;
  onMoveStage: (leadId: string, stageId: string) => Promise<void>;
  onAddActivity: (leadId: string, type: LeadActivityType, content: string) => Promise<void>;
  onConvert: (leadId: string) => Promise<unknown>;
}) {
  const [isStagePending, startStageTransition] = useTransition();
  const [isActivityPending, startActivityTransition] = useTransition();
  const [isConvertPending, startConvertTransition] = useTransition();
  const [activityType, setActivityType] = useState<LeadActivityType>("NOTE");
  const [content, setContent] = useState("");

  // Base UI Select.Value chỉ resolve được label khi Select.Root nhận `items` tường
  // minh — nếu không, item chỉ đăng ký label lúc popup đang mở, đóng lại là mất, nên
  // trigger hiện lại raw value (id/enum) thay vì label. Luôn truyền `items`.
  const stageItems = Object.fromEntries(stages.map((s) => [s.id, `${s.name} (${PIPELINE_STAGE_TYPE_LABELS[s.type]})`]));
  const activityTypeItems = Object.fromEntries(MANUAL_LEAD_ACTIVITY_TYPES.map((t) => [t, LEAD_ACTIVITY_TYPE_LABELS[t]]));

  function handleMoveStage(newStageId: string) {
    startStageTransition(async () => {
      try {
        await onMoveStage(leadId, newStageId);
        toast.success("Đã đổi giai đoạn");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handleAddActivity() {
    if (!content.trim()) return;
    startActivityTransition(async () => {
      try {
        await onAddActivity(leadId, activityType, content.trim());
        setContent("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handleConvert() {
    startConvertTransition(async () => {
      try {
        await onConvert(leadId);
        toast.success("Đã chuyển thành khách hàng");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select items={stageItems} value={stageId} disabled={!canUpdate || isStagePending} onValueChange={(v) => v && handleMoveStage(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({PIPELINE_STAGE_TYPE_LABELS[s.type]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canConvert && (
          <Button type="button" variant="outline" size="sm" disabled={isConvertPending} onClick={handleConvert}>
            {isConvertPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
            Chuyển thành khách hàng
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hoạt động</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canUpdate && (
            <div className="flex flex-col gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Select items={activityTypeItems} value={activityType} onValueChange={(v) => setActivityType(v as LeadActivityType)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_LEAD_ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LEAD_ACTIVITY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ghi lại nội dung trao đổi..."
                  className="min-h-9 flex-1"
                  rows={1}
                />
                <Button type="button" size="icon" disabled={isActivityPending || !content.trim()} onClick={handleAddActivity} aria-label="Gửi hoạt động">
                  {isActivityPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {activities.length === 0 && <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>}
            {activities.map((a) => (
              <div key={a.id} className="flex gap-2 text-sm">
                <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {LEAD_ACTIVITY_TYPE_LABELS[a.type]}
                </span>
                <div className="flex-1">
                  <p>{a.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actor?.name ?? "Hệ thống"} · {format(new Date(a.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
