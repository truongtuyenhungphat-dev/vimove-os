"use server";

import { auth } from "@/auth";
import { logError } from "./logger";

/**
 * Phase 10 — Scale: cầu nối để error boundary phía Client Component (bắt buộc
 * "use client" — xem app/(protected)/error.tsx, app/global-error.tsx) ghi lỗi thật
 * vào DB qua logger server-only. Không dùng `requireSession()` (sẽ redirect) vì lỗi
 * có thể xảy ra cả lúc chưa đăng nhập (vd global-error) — đọc session nếu có, không
 * bắt buộc.
 */
export async function reportClientErrorAction(message: string, stack: string | null, path: string) {
  const session = await auth();
  const err = new Error(message);
  if (stack) err.stack = stack;
  await logError(err, {
    organizationId: session?.user?.organizationId ?? null,
    userId: session?.user?.id ?? null,
    path,
  });
}
