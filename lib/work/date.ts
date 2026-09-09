import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";

// Helper thuần (không server-only) — dùng chung cho Calendar/Timeline/Gantt,
// cả ở Server Component (fetch dữ liệu theo khoảng ngày) lẫn Client Component
// (dựng lưới hiển thị).

export const WEEKDAY_LABELS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Toàn bộ ô ngày hiển thị trên lưới tháng (kể cả ngày tháng trước/sau để lấp đủ tuần). */
export function getMonthGridDays(monthDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getDateRangeDays(start: Date, end: Date): Date[] {
  if (end < start) return [start];
  return eachDayOfInterval({ start, end });
}

/** Số ngày (>=1) giữa 2 mốc — dùng tính độ rộng thanh Timeline/Gantt theo cột ngày. */
export function daySpan(start: Date, end: Date) {
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

export { isSameMonth, isSameDay };
