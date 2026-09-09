// Type union + nhãn hiển thị cho CRM (Phase 4) — cùng tinh thần lib/work/types.ts,
// lib/process/types.ts ở các phase trước: nguồn sự thật duy nhất cho label tiếng Việt,
// tránh lặp lại chuỗi rải rác trong component.

export type PipelineStageType = "OPEN" | "WON" | "LOST";

export const PIPELINE_STAGE_TYPE_LABELS: Record<PipelineStageType, string> = {
  OPEN: "Đang xử lý",
  WON: "Thắng",
  LOST: "Thua",
};

export type LeadSource = "MANUAL" | "WEBSITE" | "REFERRAL" | "ADS" | "EVENT" | "OTHER";

export const LEAD_SOURCES: LeadSource[] = ["MANUAL", "WEBSITE", "REFERRAL", "ADS", "EVENT", "OTHER"];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  MANUAL: "Nhập thủ công",
  WEBSITE: "Website",
  REFERRAL: "Giới thiệu",
  ADS: "Quảng cáo",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

export type LeadActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STAGE_CHANGED" | "CONVERTED";

export const LEAD_ACTIVITY_TYPE_LABELS: Record<LeadActivityType, string> = {
  NOTE: "Ghi chú",
  CALL: "Gọi điện",
  EMAIL: "Email",
  MEETING: "Gặp mặt",
  STAGE_CHANGED: "Đổi giai đoạn",
  CONVERTED: "Chuyển thành khách hàng",
};

// Loại hoạt động người dùng có thể tự ghi (không gồm STAGE_CHANGED/CONVERTED — 2 loại
// đó hệ thống tự ghi khi có hành động tương ứng).
export const MANUAL_LEAD_ACTIVITY_TYPES: LeadActivityType[] = ["NOTE", "CALL", "EMAIL", "MEETING"];
