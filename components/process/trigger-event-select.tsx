"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTOMATION_EVENT_TYPES, AUTOMATION_EVENT_TYPE_LABELS } from "@/lib/process/types";

const MANUAL_VALUE = "__manual__";

/** Cấu hình kích hoạt tự động (Phase 9) — chọn 1 event type thật để workflow tự chạy
 * mỗi khi event đó xảy ra, hoặc "Chỉ chạy thủ công" (mặc định, giống Phase 3). */
export function TriggerEventSelect({
  workflowId,
  triggerEventType,
  canManage,
  onChange,
}: {
  workflowId: string;
  triggerEventType: string | null;
  canManage: boolean;
  onChange: (workflowId: string, eventType: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const items: Record<string, string> = { [MANUAL_VALUE]: "Chỉ chạy thủ công", ...AUTOMATION_EVENT_TYPE_LABELS };

  function handleChange(value: string) {
    startTransition(async () => {
      try {
        await onChange(workflowId, value === MANUAL_VALUE ? "" : value);
        toast.success("Đã cập nhật cấu hình kích hoạt");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Zap className="size-4" aria-hidden="true" /> Kích hoạt tự động
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Workflow chỉ tự chạy khi đã publish và đang bật (Đang hoạt động).</p>
        <Select items={items} value={triggerEventType ?? MANUAL_VALUE} disabled={!canManage || isPending} onValueChange={(v) => v && handleChange(v)}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MANUAL_VALUE}>Chỉ chạy thủ công</SelectItem>
            {AUTOMATION_EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {AUTOMATION_EVENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
