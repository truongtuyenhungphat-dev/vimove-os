import { addDays, startOfWeek } from "date-fns";

// Lưu ý: KHÔNG import "server-only" ở đây — các hằng số/hàm thuần này còn được
// dùng lại ở client component (workload-view.tsx) để tô màu theo ngưỡng.

/**
 * Công thức Workload (Phase 2, §2 docs/02-work-hub.md):
 * % = tổng estimateHours của các task đang mở (không DONE/CANCELLED) có khoảng
 * thời gian giao với tuần đang xét, chia cho năng suất chuẩn mỗi tuần.
 */
export const WEEKLY_CAPACITY_HOURS = 40;

export const WORKLOAD_WARN_THRESHOLD = 80;
export const WORKLOAD_OVER_THRESHOLD = 100;

export type WorkloadTone = "ok" | "warn" | "over";

export function getWorkloadTone(percent: number): WorkloadTone {
  if (percent > WORKLOAD_OVER_THRESHOLD) return "over";
  if (percent >= WORKLOAD_WARN_THRESHOLD) return "warn";
  return "ok";
}

export function computeWorkloadPercent(estimateHours: number, capacityHours = WEEKLY_CAPACITY_HOURS) {
  if (capacityHours <= 0) return 0;
  return Math.round((estimateHours / capacityHours) * 100);
}

/** Tuần bắt đầu từ Thứ 2 (chuẩn làm việc VN). */
export function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekRange(date: Date) {
  const start = getWeekStart(date);
  const end = addDays(start, 6);
  return { start, end };
}
