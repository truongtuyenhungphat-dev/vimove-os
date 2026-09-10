"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrDisplay } from "./qr-display";

export function QrDialog({
  locationId,
  locationName,
  generateToken,
}: {
  locationId: string;
  locationName: string;
  generateToken: (locationId: string) => Promise<{ token: string; expiresAt: string; locationName: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <QrCode aria-hidden="true" /> Hiện QR
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col items-center overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle>Mã QR chấm công — {locationName}</DialogTitle>
          <DialogDescription>Mở màn hình này tại văn phòng để nhân sự quét bằng camera điện thoại.</DialogDescription>
        </DialogHeader>
        {open && <QrDisplay locationId={locationId} generateToken={generateToken} />}
      </DialogContent>
    </Dialog>
  );
}
