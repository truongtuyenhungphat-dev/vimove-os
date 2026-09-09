// Union types + nhãn tiếng Việt cho Work Hub — dùng chung server & client.
// Giữ dạng string-literal union (không import enum từ app/generated/prisma) để nhất
// quán với cách Phase 1 xử lý UserStatus (services/core/users.ts).

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  IN_REVIEW: "Chờ duyệt",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

export type TaskActivityType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "RESCHEDULED"
  | "PRIORITY_CHANGED"
  | "UPDATED"
  | "COMMENTED"
  | "CHECKLIST_ITEM_ADDED"
  | "CHECKLIST_ITEM_TOGGLED"
  | "CHECKLIST_ITEM_REMOVED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED"
  | "DEPENDENCY_ADDED"
  | "DEPENDENCY_REMOVED"
  | "WATCHER_ADDED"
  | "WATCHER_REMOVED"
  | "TIME_LOGGED";

export const TASK_ACTIVITY_LABELS: Record<TaskActivityType, string> = {
  CREATED: "đã tạo công việc",
  STATUS_CHANGED: "đã đổi trạng thái",
  ASSIGNED: "đã đổi người phụ trách",
  RESCHEDULED: "đã dời lịch",
  PRIORITY_CHANGED: "đã đổi độ ưu tiên",
  UPDATED: "đã cập nhật công việc",
  COMMENTED: "đã bình luận",
  CHECKLIST_ITEM_ADDED: "đã thêm mục checklist",
  CHECKLIST_ITEM_TOGGLED: "đã tick checklist",
  CHECKLIST_ITEM_REMOVED: "đã xoá mục checklist",
  ATTACHMENT_ADDED: "đã thêm đính kèm",
  ATTACHMENT_REMOVED: "đã xoá đính kèm",
  DEPENDENCY_ADDED: "đã thêm phụ thuộc",
  DEPENDENCY_REMOVED: "đã gỡ phụ thuộc",
  WATCHER_ADDED: "đã theo dõi công việc",
  WATCHER_REMOVED: "đã bỏ theo dõi",
  TIME_LOGGED: "đã ghi nhận thời gian",
};
