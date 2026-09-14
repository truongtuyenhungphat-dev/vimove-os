// Định dạng ngày/giờ LUÔN theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7) — dùng
// cho mọi nơi hiển thị giờ chấm công/ca làm/nghỉ phép, bất kể chạy ở đâu:
// - Server Component: Vercel chạy mặc định giờ UTC, KHÔNG phải giờ VN — nếu gọi
//   toLocaleTimeString/toLocaleDateString mà không chỉ định timeZone, kết quả lệch
//   7 tiếng so với giờ thật (bug đã gặp thật: "chấm công đang sai giờ", 2026-09-14).
// - Client Component: dùng giờ hệ điều hành máy người dùng, thường đúng giờ VN
//   nhưng không đảm bảo (máy đặt sai múi giờ, hoặc nhân viên đang ở nước ngoài) —
//   ép cứng timeZone để giờ chấm công luôn khớp hồ sơ chấm công/lương ở VN, không
//   phụ thuộc múi giờ thiết bị.
const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

export function formatVnTime(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleTimeString("vi-VN", { timeZone: VN_TIMEZONE, ...opts });
}

export function formatVnDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("vi-VN", { timeZone: VN_TIMEZONE, ...opts });
}
