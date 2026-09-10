import type { Metadata } from "next";
import { MapPinned } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { listLocations } from "@/services/attendance/locations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { LocationDialog } from "@/components/attendance/location-dialog";
import { QrDialog } from "@/components/attendance/qr-dialog";
import { createLocationAction, updateLocationAction, deleteLocationAction, generateQrTokenAction } from "./actions";

export const metadata: Metadata = { title: "Địa điểm chấm công — VIMOVE OS" };

export default async function LocationsPage() {
  const session = await requirePermission("attendance.manage");
  const locations = await listLocations(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Địa điểm chấm công"
        description="Tâm bán kính cho chấm công GPS, nơi hiện mã QR động"
        actions={<LocationDialog action={createLocationAction} />}
      />

      {locations.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={MapPinned}
              title="Chưa có địa điểm nào"
              description="Thêm địa điểm đầu tiên để bật chấm công GPS/QR cho tổ chức."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · bán kính {loc.radiusMeters}m
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <QrDialog locationId={loc.id} locationName={loc.name} generateToken={generateQrTokenAction} />
                  <LocationDialog
                    location={loc}
                    action={updateLocationAction.bind(null, loc.id)}
                    trigger={<Button variant="outline" size="sm">Sửa</Button>}
                  />
                  <ConfirmDeleteButton
                    title={`Xoá địa điểm "${loc.name}"`}
                    description="Các lượt chấm công GPS/QR đã ghi nhận tại địa điểm này vẫn được giữ lại, chỉ không dùng được để chấm công mới."
                    onConfirm={deleteLocationAction.bind(null, loc.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
