// Báo cáo công việc hàng ngày — thay quy trình Google Sheets thủ công của team
// Marketing (checklist cố định theo vai trò + việc tự thêm + việc được giao, tổng
// hợp % hoàn thành theo ngày/tháng cho quản lý theo dõi).

export const DAILY_REPORT_ITEM_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "POSTPONED"] as const;
export type DailyReportItemStatus = (typeof DAILY_REPORT_ITEM_STATUSES)[number];

export const DAILY_REPORT_ITEM_STATUS_LABELS: Record<DailyReportItemStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Xong",
  POSTPONED: "Hoãn",
};

/** Ngày hiện tại theo giờ VN, dạng "YYYY-MM-DD" — cùng quy ước ChannelSnapshot.date/
 * ProductionEntry.date (so sánh chuỗi đúng thứ tự thời gian). */
export function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Thứ trong tuần (0=CN..6=T7) từ chuỗi "YYYY-MM-DD", không lệch múi giờ vì parse UTC
 * và ngày làm việc chỉ cần đúng thứ-trong-tuần, không cần giờ chính xác. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** Ngày làm việc T2–T7 (không tính Chủ nhật) — khớp quy ước sheet gốc của team. */
export function isWorkingDay(dateStr: string): boolean {
  return weekdayOf(dateStr) !== 0;
}

export const WEEKDAY_SHORT_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function weekdayShort(dateStr: string): string {
  return WEEKDAY_SHORT_VN[weekdayOf(dateStr)];
}

export function dayOfMonth(dateStr: string): number {
  return Number(dateStr.slice(-2));
}

export function daysInMonth(year: number, month1to12: number): string[] {
  const days: string[] = [];
  const last = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  for (let d = 1; d <= last; d++) {
    days.push(`${year}-${String(month1to12).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export type ReportTone = "empty" | "low" | "mid" | "done";

/** Tô màu % hoàn thành theo đúng mô tả sheet gốc: "đỏ 0% → vàng 50% → xanh 100%". */
export function reportTone(percent: number, total: number): ReportTone {
  if (total === 0) return "empty";
  if (percent >= 100) return "done";
  if (percent >= 50) return "mid";
  return "low";
}

export function computeReportPercent(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}
