"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientErrorAction } from "@/lib/observability/report-client-error";

export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
    // Phase 10 — Scale: ghi lỗi thật vào ErrorLog (xem /admin/observability), không
    // chỉ console.error như trước. Lỗi khi gửi log không hiện gì thêm cho user — đúng
    // hành vi "logging không được làm hỏng trải nghiệm đã lỗi sẵn".
    reportClientErrorAction(error.message, error.stack ?? null, pathname).catch(() => {});
  }, [error, pathname]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">Đã có lỗi xảy ra</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.digest ? `Mã lỗi: ${error.digest}` : "Vui lòng thử lại hoặc liên hệ Quản trị viên."}
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Thử lại
      </Button>
    </div>
  );
}
