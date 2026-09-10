"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_GEOFENCE_RADIUS_METERS } from "@/lib/attendance/types";

type LocationData = { id: string; name: string; latitude: number; longitude: number; radiusMeters: number };

export function LocationDialog({
  location,
  action,
  trigger,
}: {
  location?: LocationData;
  action: (formData: FormData) => Promise<void>;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [latitude, setLatitude] = useState(location?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(location?.longitude?.toString() ?? "");
  const [locating, setLocating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
        setLocating(false);
      },
      () => {
        toast.error("Không lấy được vị trí hiện tại.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(location ? "Đã cập nhật địa điểm" : "Đã tạo địa điểm");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm" />}>
        {!trigger && (
          <>
            <Plus aria-hidden="true" /> Thêm địa điểm
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? "Sửa địa điểm" : "Thêm địa điểm chấm công"}</DialogTitle>
          <DialogDescription>Tâm bán kính cho chấm công GPS + nơi gắn mã QR.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-name">Tên địa điểm</Label>
            <Input id="loc-name" name="name" defaultValue={location?.name} placeholder="Văn phòng chính" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="loc-lat">Vĩ độ (latitude)</Label>
              <Input id="loc-lat" name="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="loc-lng">Kinh độ (longitude)</Label>
              <Input id="loc-lng" name="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
            {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
            Dùng vị trí hiện tại của tôi
          </Button>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-radius">Bán kính chấp nhận (mét)</Label>
            <Input id="loc-radius" name="radiusMeters" type="number" min={20} defaultValue={location?.radiusMeters ?? DEFAULT_GEOFENCE_RADIUS_METERS} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {location ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
