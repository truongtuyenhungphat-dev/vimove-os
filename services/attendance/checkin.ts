import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { findNearestLocation } from "@/lib/attendance/geo";
import { resolveQrToken, markQrTokenUsed } from "./qr";
import type { AttendanceMethod } from "@/lib/attendance/types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Bản ghi gần nhất hôm nay — quyết định lượt chấm công tiếp theo là vào hay ra. */
export async function getTodayStatus(organizationId: string, userId: string) {
  const now = new Date();
  const last = await prisma.attendanceRecord.findFirst({
    where: { organizationId, userId, occurredAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    orderBy: { occurredAt: "desc" },
    include: { location: { select: { name: true } } },
  });
  const nextType = !last || last.type === "CHECK_OUT" ? "CHECK_IN" : "CHECK_OUT";
  return { last, nextType: nextType as "CHECK_IN" | "CHECK_OUT" };
}

/**
 * Chấm công thật — quyết định vào/ra tự động dựa trên bản ghi gần nhất trong ngày
 * (không cho chọn tay để tránh 2 lượt "vào" liên tiếp). Mỗi hình thức xác thực khác
 * nhau (xem lib/attendance/types.ts — chỉ MANUAL/GPS/QR khả thi thật trên web app):
 * - MANUAL: không cần xác thực gì thêm, tin vào phiên đăng nhập.
 * - GPS: bắt buộc toạ độ thật từ trình duyệt, PHẢI nằm trong bán kính 1 địa điểm đã
 *   cấu hình — từ chối rõ ràng kèm khoảng cách thật nếu ở ngoài, không bao giờ "cho
 *   qua" khi không chắc.
 * - QR: token phải còn hiệu lực (xem services/attendance/qr.ts) — hết hạn/sai đều bị
 *   từ chối với lý do thật.
 */
export async function checkInOrOut(
  organizationId: string,
  userId: string,
  input: { method: AttendanceMethod; latitude?: number; longitude?: number; qrToken?: string }
) {
  const { nextType } = await getTodayStatus(organizationId, userId);

  let locationId: string | null = null;
  let distanceMeters: number | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (input.method === "GPS") {
    if (input.latitude === undefined || input.longitude === undefined) {
      throw new Error("Thiếu toạ độ GPS — trình duyệt chưa cấp quyền định vị hoặc chưa lấy được vị trí.");
    }
    const locations = await prisma.attendanceLocation.findMany({ where: { organizationId } });
    if (locations.length === 0) {
      throw new Error("Chưa cấu hình địa điểm văn phòng — liên hệ quản trị viên để bật chấm công GPS.");
    }
    const nearest = findNearestLocation(input.latitude, input.longitude, locations);
    if (!nearest || nearest.distance > nearest.location.radiusMeters) {
      const d = nearest ? Math.round(nearest.distance) : null;
      const nearName = nearest?.location.name ?? "?";
      throw new Error(
        d !== null
          ? `Bạn đang cách "${nearName}" khoảng ${d}m — cần trong bán kính ${nearest!.location.radiusMeters}m để chấm công GPS.`
          : "Không xác định được vị trí văn phòng gần nhất."
      );
    }
    locationId = nearest.location.id;
    distanceMeters = Math.round(nearest.distance);
    latitude = input.latitude;
    longitude = input.longitude;
  } else if (input.method === "QR") {
    if (!input.qrToken) throw new Error("Thiếu mã QR.");
    const resolved = await resolveQrToken(organizationId, input.qrToken);
    if (!resolved.ok) throw new Error(resolved.reason);
    locationId = resolved.location.id;
    await markQrTokenUsed(resolved.qrId, userId);
  }
  // MANUAL: không cần thêm dữ liệu gì.

  const record = await prisma.attendanceRecord.create({
    data: {
      organizationId,
      userId,
      type: nextType,
      method: input.method,
      latitude,
      longitude,
      distanceMeters,
      locationId,
    },
    include: { location: { select: { name: true } } },
  });

  await writeAuditLog({
    organizationId,
    actorId: userId,
    action: nextType === "CHECK_IN" ? "attendance.check_in" : "attendance.check_out",
    entityType: "AttendanceRecord",
    entityId: record.id,
    after: { method: input.method, locationId, distanceMeters },
  });

  return record;
}

export type AttendanceVisibility = { scope: "ALL" | "DEPARTMENT" | "OWN"; userId: string; departmentId: string | null };

function visibilityWhere(visibility: AttendanceVisibility) {
  if (visibility.scope === "OWN") return { userId: visibility.userId };
  if (visibility.scope === "DEPARTMENT") {
    return visibility.departmentId ? { user: { departmentId: visibility.departmentId } } : { id: { in: [] as string[] } };
  }
  return {};
}

export async function listMyAttendance(organizationId: string, userId: string, month: { year: number; month: number }) {
  const from = new Date(month.year, month.month - 1, 1);
  const to = new Date(month.year, month.month, 0, 23, 59, 59, 999);
  return prisma.attendanceRecord.findMany({
    where: { organizationId, userId, occurredAt: { gte: from, lte: to } },
    orderBy: { occurredAt: "asc" },
    include: { location: { select: { name: true } } },
  });
}

export async function listOrgAttendance(
  organizationId: string,
  visibility: AttendanceVisibility,
  month: { year: number; month: number }
) {
  const from = new Date(month.year, month.month - 1, 1);
  const to = new Date(month.year, month.month, 0, 23, 59, 59, 999);
  return prisma.attendanceRecord.findMany({
    where: { organizationId, occurredAt: { gte: from, lte: to }, ...visibilityWhere(visibility) },
    orderBy: { occurredAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      location: { select: { name: true } },
    },
  });
}
