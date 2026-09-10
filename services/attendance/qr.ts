import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/client";
import { QR_TOKEN_TTL_SECONDS } from "@/lib/attendance/types";

/**
 * Sinh 1 token QR mới cho 1 địa điểm — hết hạn sau QR_TOKEN_TTL_SECONDS giây (mặc
 * định 20s). Không tái sử dụng token cũ dù chưa hết hạn — mỗi lần màn hình yêu cầu
 * mã mới đều tạo token mới thật trong DB, đúng tinh thần "QR động" (ảnh chụp màn
 * hình cũ sẽ hết hạn rất nhanh).
 */
export async function generateQrToken(organizationId: string, locationId: string) {
  const location = await prisma.attendanceLocation.findFirst({ where: { id: locationId, organizationId } });
  if (!location) throw new Error("Không tìm thấy địa điểm");

  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_SECONDS * 1000);
  await prisma.qrCheckinToken.create({ data: { organizationId, locationId, token, expiresAt } });
  return { token, expiresAt, locationName: location.name };
}

/** Xác thực token thật lúc quét — hết hạn hoặc không tồn tại đều bị từ chối rõ ràng. */
export async function resolveQrToken(organizationId: string, token: string) {
  const qr = await prisma.qrCheckinToken.findFirst({
    where: { organizationId, token },
    include: { location: true },
  });
  if (!qr) return { ok: false as const, reason: "Mã QR không hợp lệ." };
  if (qr.expiresAt < new Date()) return { ok: false as const, reason: "Mã QR đã hết hạn — vui lòng quét lại mã mới trên màn hình." };
  return { ok: true as const, location: qr.location, qrId: qr.id };
}

export async function markQrTokenUsed(qrId: string, userId: string) {
  await prisma.qrCheckinToken.update({ where: { id: qrId }, data: { usedByUserId: userId } }).catch(() => {});
}
