// Union types + nhãn tiếng Việt cho Chấm công (Phase 11), cùng quy ước với
// lib/work/types.ts.

export const ATTENDANCE_TYPE_LABELS: Record<"CHECK_IN" | "CHECK_OUT", string> = {
  CHECK_IN: "Chấm công vào",
  CHECK_OUT: "Chấm công ra",
};

export const ATTENDANCE_METHODS = ["MANUAL", "GPS", "QR"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];
export const ATTENDANCE_METHOD_LABELS: Record<AttendanceMethod, string> = {
  MANUAL: "Thủ công",
  GPS: "Định vị GPS",
  QR: "Quét mã QR",
};

/**
 * Hình thức MISA AMIS có nhưng KHÔNG làm được thật trên web app thuần (không có
 * phần cứng/app native riêng) — hiện trong UI dưới dạng lựa chọn bị vô hiệu hoá kèm lý
 * do thật, không giả lập hoạt động. Xem ghi chú đầu file prisma/schema.prisma § Phase 11.
 */
export const UNAVAILABLE_ATTENDANCE_METHODS: { label: string; reason: string }[] = [
  { label: "Wifi nội bộ", reason: "Trình duyệt không có API đọc tên mạng Wifi đang kết nối — cần app di động riêng." },
  { label: "Nhận diện khuôn mặt (FaceID)", reason: "Cần mô hình nhận diện khuôn mặt + phần cứng camera chuyên dụng, ngoài phạm vi web app." },
  { label: "Máy chấm công vân tay", reason: "Cần tích hợp phần cứng máy chấm công vật lý riêng của nhà sản xuất." },
];

export const LEAVE_TYPES = ["ANNUAL", "SICK", "UNPAID", "BUSINESS_TRIP", "OTHER"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Nghỉ phép năm",
  SICK: "Nghỉ ốm",
  UNPAID: "Nghỉ không lương",
  BUSINESS_TRIP: "Công tác",
  OTHER: "Khác",
};

/** Bán kính mặc định (mét) khi tạo địa điểm chấm công GPS mới — khớp gợi ý phổ biến
 * của các phần mềm chấm công (đủ rộng cho sai số GPS trong nhà, không quá rộng để
 * mất tác dụng kiểm soát). */
export const DEFAULT_GEOFENCE_RADIUS_METERS = 200;

/** QR động đổi mỗi 20 giây — đủ ngắn để ảnh chụp màn hình cũ hết hạn nhanh (đúng tinh
 * thần "QR động chống gian lận"), đủ dài để không gây giật hình khi hiển thị trên
 * màn hình văn phòng. */
export const QR_TOKEN_TTL_SECONDS = 20;
