// Type union + nhãn hiển thị cho AI Command Center (Phase 8).

export type AiInsightType = "WORK_BOTTLENECK" | "WORKLOAD_IMBALANCE" | "PROJECT_HEALTH" | "MARKETING_ANOMALY" | "BUDGET_OPTIMIZATION";
export const AI_INSIGHT_TYPE_LABELS: Record<AiInsightType, string> = {
  WORK_BOTTLENECK: "Điểm nghẽn công việc",
  WORKLOAD_IMBALANCE: "Lệch khối lượng công việc",
  PROJECT_HEALTH: "Sức khoẻ dự án",
  MARKETING_ANOMALY: "Bất thường Marketing",
  BUDGET_OPTIMIZATION: "Tối ưu ngân sách",
};

export type AiInsightSeverity = "LOW" | "MEDIUM" | "HIGH";
export const AI_INSIGHT_SEVERITY_LABELS: Record<AiInsightSeverity, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export type AiRecommendationStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
export const AI_RECOMMENDATION_STATUS_LABELS: Record<AiRecommendationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  EXECUTED: "Đã thực thi",
};

export type AiActionStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export const AI_ACTION_STATUS_LABELS: Record<AiActionStatus, string> = {
  PENDING: "Đang xử lý",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
};
