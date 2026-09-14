import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { getTodayStatus } from "@/services/attendance/checkin";
import { listLocations } from "@/services/attendance/locations";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CheckinPanel } from "@/components/attendance/checkin-panel";
import { ATTENDANCE_METHOD_LABELS } from "@/lib/attendance/types";
import { formatVnTime } from "@/lib/format";

export const metadata: Metadata = { title: "Chấm công — VIMOVE OS" };

export default async function CheckinPage() {
  const session = await requirePermission("attendance.read");

  const [{ last, nextType }, locations] = await Promise.all([
    getTodayStatus(session.user.organizationId, session.user.id),
    listLocations(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader title="Chấm công" description="Chấm công vào/ra hôm nay — thủ công, GPS hoặc quét mã QR tại văn phòng" />

      <CheckinPanel nextType={nextType} hasGpsLocations={locations.length > 0} />

      <Card>
        <CardContent>
          <p className="mb-2 text-sm font-medium">Lượt chấm công gần nhất hôm nay</p>
          {last ? (
            <p className="text-sm text-muted-foreground">
              {last.type === "CHECK_IN" ? "Vào" : "Ra"} lúc {formatVnTime(last.occurredAt)} — {ATTENDANCE_METHOD_LABELS[last.method]}
              {last.location ? ` tại "${last.location.name}"` : ""}
              {last.distanceMeters !== null ? ` (cách ${Math.round(last.distanceMeters)}m)` : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có lượt chấm công nào hôm nay.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
