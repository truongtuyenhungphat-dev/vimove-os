import "server-only";

/**
 * Phase 10 — Scale: structured logging thật, KHÔNG cần dịch vụ ngoài (khác nhóm bị
 * chặn credential như Ads/Claude API). In JSON 1 dòng/log ra console (stdout của
 * Next.js server — Vercel/self-host đều thu log qua đây được ngay, không cần cấu
 * hình thêm) VÀ ghi lỗi thật vào bảng `ErrorLog` để xem lại tại
 * /admin/observability. Không giả lập gửi đi đâu cả — đây chính là nơi lỗi được lưu.
 */

type LogLevel = "info" | "warn" | "error";

type LogFields = {
  organizationId?: string | null;
  userId?: string | null;
  path?: string;
  [key: string]: unknown;
};

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = { level, message, time: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

/**
 * Ghi 1 lỗi THẬT vào DB (bảng `ErrorLog`) — dùng trong catch block của Server
 * Action/Route Handler/error boundary. Lỗi khi ghi log không được làm hỏng luồng gốc
 * (catch nuốt lỗi ghi log, chỉ console.error cảnh báo) — logging không bao giờ được
 * phép là nguyên nhân gây lỗi mới.
 */
export async function logError(
  error: unknown,
  context: { organizationId?: string | null; userId?: string | null; path?: string; extra?: Record<string, unknown> } = {}
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? null) : null;
  emit("error", message, { organizationId: context.organizationId, userId: context.userId, path: context.path });

  try {
    // Import động để tránh vòng phụ thuộc (lib/db/client → nhiều service → có thể
    // gián tiếp cần logger) và để logger dùng được ở nơi chưa chắc đã có Prisma sẵn.
    const { prisma } = await import("@/lib/db/client");
    await prisma.errorLog.create({
      data: {
        organizationId: context.organizationId ?? null,
        userId: context.userId ?? null,
        level: "error",
        message,
        stack,
        path: context.path ?? null,
        context: context.extra as object | undefined,
      },
    });
  } catch (writeErr) {
    console.error("logError: không ghi được ErrorLog vào DB:", writeErr);
  }
}
