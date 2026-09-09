import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Quên mật khẩu — VIMOVE OS" };

// Chưa có email provider được cấu hình (Phase 1) nên trang này không giả vờ gửi
// email đặt lại mật khẩu — nói thẳng cần Admin hỗ trợ, đúng quy tắc "không tạo
// fake button" (§34.6).
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Quên mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Tính năng tự đặt lại mật khẩu qua email chưa được triển khai ở giai đoạn này.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        Vui lòng liên hệ Quản trị viên hệ thống để được đặt lại mật khẩu thủ công qua trang
        Quản trị &gt; Người dùng.
      </div>
      <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/login" />}>
        Quay lại đăng nhập
      </Button>
    </div>
  );
}
