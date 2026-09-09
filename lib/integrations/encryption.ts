import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Mã hoá token OAuth trước khi lưu DB (§3 rule 8 + nghiệm thu Phase 6: "OAuth không
 * lộ credential ra client/log"). AES-256-GCM — mỗi lần encrypt sinh IV ngẫu nhiên
 * riêng, không tái sử dụng.
 *
 * `ENCRYPTION_KEY` (bắt buộc trong `.env` khi dùng thật — xem `.env.example`) là một
 * chuỗi bất kỳ, được đưa qua `scrypt` để ra đúng khoá 32 byte cho AES-256 (không cần
 * người vận hành tự tạo khoá đúng định dạng hex/base64).
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Thiếu biến môi trường ENCRYPTION_KEY — cần thiết lập trước khi lưu token OAuth.");
  }
  return scryptSync(secret, "vimove-os-ads-token", 32);
}

const IV_LENGTH = 12; // khuyến nghị cho GCM
const AUTH_TAG_LENGTH = 16;

export function encryptToken(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Gói iv + authTag + ciphertext vào 1 chuỗi base64 duy nhất để lưu 1 cột DB.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encoded: string): string {
  const key = getKey();
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
