import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { checkInOrOut } from "@/services/attendance/checkin";
import { Button } from "@/components/ui/button";
import { formatVnTime } from "@/lib/format";

export const metadata: Metadata = { title: "Chấm công QR — VIMOVE OS" };

/**
 * Trang đích khi quét QR chấm công (public/... không phải — vẫn nằm trong
 * (protected), nếu chưa đăng nhập middleware tự chuyển sang /login rồi quay lại đúng
 * URL này nhờ callbackUrl, đúng hành vi chung của cả app). Thực hiện chấm công NGAY
 * lúc render trang — đây chính là hành động mà việc mở URL này đại diện cho (tương tự
 * link xác thực email 1 lần dùng), không cần thêm 1 cú bấm nút nữa.
 */
export default async function QrCheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await requirePermission("attendance.read");
  const { token } = await params;

  let result: { type: "CHECK_IN" | "CHECK_OUT"; occurredAt: Date; locationName: string | null } | null = null;
  let error: string | null = null;
  try {
    const record = await checkInOrOut(session.user.organizationId, session.user.id, { method: "QR", qrToken: token });
    result = { type: record.type, occurredAt: record.occurredAt, locationName: record.location?.name ?? null };
  } catch (err) {
    error = err instanceof Error ? err.message : "Có lỗi xảy ra";
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {result ? (
        <>
          <CheckCircle2 className="size-12 text-emerald-500" />
          <div>
            <p className="text-lg font-semibold">{result.type === "CHECK_IN" ? "Đã chấm công vào" : "Đã chấm công ra"} thành công</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lúc {formatVnTime(result.occurredAt)} {result.locationName ? `tại "${result.locationName}"` : ""}
            </p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="size-12 text-destructive" />
          <div>
            <p className="text-lg font-semibold">Không thể chấm công</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </>
      )}
      <Button size="sm" nativeButton={false} render={<Link href="/attendance/checkin" />}>
        Về trang Chấm công
      </Button>
    </div>
  );
}
