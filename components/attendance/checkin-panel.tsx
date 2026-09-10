"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Fingerprint, MapPin, QrCode, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { checkInOrOutAction } from "@/app/(protected)/attendance/checkin/actions";
import { ATTENDANCE_TYPE_LABELS, UNAVAILABLE_ATTENDANCE_METHODS } from "@/lib/attendance/types";

export function CheckinPanel({
  nextType,
  hasGpsLocations,
}: {
  nextType: "CHECK_IN" | "CHECK_OUT";
  hasGpsLocations: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingMethod, setPendingMethod] = useState<"MANUAL" | "GPS" | null>(null);

  function doManual() {
    setPendingMethod("MANUAL");
    startTransition(async () => {
      try {
        const res = await checkInOrOutAction({ method: "MANUAL" });
        toast.success(`${ATTENDANCE_TYPE_LABELS[res.type]} lúc ${new Date(res.occurredAt).toLocaleTimeString("vi-VN")}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function doGps() {
    if (!("geolocation" in navigator)) {
      toast.error("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setPendingMethod("GPS");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          try {
            const res = await checkInOrOutAction({
              method: "GPS",
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            toast.success(`${ATTENDANCE_TYPE_LABELS[res.type]} lúc ${new Date(res.occurredAt).toLocaleTimeString("vi-VN")} — ${res.locationName}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
          }
        });
      },
      (geoErr) => {
        toast.error(geoErr.code === geoErr.PERMISSION_DENIED ? "Bạn chưa cho phép truy cập vị trí." : "Không lấy được vị trí GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Lượt chấm công tiếp theo của bạn</p>
          <p className="text-2xl font-semibold">{ATTENDANCE_TYPE_LABELS[nextType]}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            size="lg"
            className="h-auto flex-col gap-2 py-4"
            onClick={doManual}
            disabled={isPending}
          >
            {isPending && pendingMethod === "MANUAL" ? <Loader2 className="size-5 animate-spin" /> : <Fingerprint className="size-5" />}
            Chấm công thủ công
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={doGps}
            disabled={isPending || !hasGpsLocations}
          >
            {isPending && pendingMethod === "GPS" ? <Loader2 className="size-5 animate-spin" /> : <MapPin className="size-5" />}
            Chấm công GPS
          </Button>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button size="lg" variant="outline" className="h-auto flex-col gap-2 py-4" disabled>
                  <QrCode className="size-5" />
                  Quét mã QR
                </Button>
              }
            />
            <TooltipContent>Mở camera điện thoại, quét mã QR hiển thị tại văn phòng (xem trang Địa điểm)</TooltipContent>
          </Tooltip>
        </div>

        {!hasGpsLocations && (
          <p className="text-xs text-muted-foreground">Chấm công GPS chưa khả dụng — tổ chức chưa cấu hình địa điểm văn phòng.</p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {UNAVAILABLE_ATTENDANCE_METHODS.map((m) => (
            <Tooltip key={m.label}>
              <TooltipTrigger
                render={
                  <span className="flex cursor-not-allowed items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                    <HelpCircle className="size-3" />
                    {m.label}
                  </span>
                }
              />
              <TooltipContent>{m.reason}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
