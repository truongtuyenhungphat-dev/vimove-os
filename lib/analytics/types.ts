// Type union + nhãn hiển thị cho Analytics (Phase 7).

export type ReportDataset = "LEADS" | "ORDERS" | "CAMPAIGNS" | "CONTENT";
export const REPORT_DATASETS: ReportDataset[] = ["LEADS", "ORDERS", "CAMPAIGNS", "CONTENT"];
export const REPORT_DATASET_LABELS: Record<ReportDataset, string> = {
  LEADS: "Lead",
  ORDERS: "Đơn hàng",
  CAMPAIGNS: "Chiến dịch",
  CONTENT: "Nội dung",
};

export type ReportVisualization = "TABLE" | "BAR" | "LINE" | "PIE";
export const REPORT_VISUALIZATIONS: ReportVisualization[] = ["TABLE", "BAR", "LINE", "PIE"];
export const REPORT_VISUALIZATION_LABELS: Record<ReportVisualization, string> = {
  TABLE: "Bảng",
  BAR: "Cột",
  LINE: "Đường",
  PIE: "Tròn",
};

/** Định nghĩa dimension/metric khả dụng cho từng dataset — dùng cho cả UI (dropdown)
 * và service layer (runReportWidget) để tránh lệch giữa 2 phía. */
export const DATASET_DIMENSIONS: Record<ReportDataset, { value: string; label: string }[]> = {
  LEADS: [
    { value: "source", label: "Nguồn" },
    { value: "stageName", label: "Giai đoạn" },
    { value: "ownerName", label: "Người phụ trách" },
  ],
  ORDERS: [
    { value: "status", label: "Trạng thái" },
    { value: "channelName", label: "Kênh bán" },
  ],
  CAMPAIGNS: [
    { value: "status", label: "Trạng thái" },
  ],
  CONTENT: [
    { value: "type", label: "Loại nội dung" },
    { value: "status", label: "Giai đoạn" },
  ],
};

export const DATASET_METRICS: Record<ReportDataset, { value: string; label: string }[]> = {
  LEADS: [
    { value: "count", label: "Số lượng" },
    { value: "totalValue", label: "Tổng giá trị ước tính" },
  ],
  ORDERS: [
    { value: "count", label: "Số lượng" },
    { value: "totalRevenue", label: "Tổng doanh thu" },
  ],
  CAMPAIGNS: [
    { value: "count", label: "Số lượng" },
    { value: "totalBudget", label: "Tổng ngân sách" },
  ],
  CONTENT: [{ value: "count", label: "Số lượng" }],
};

export type DataQualityIssueType = "SYNC_FAILURE" | "MISSING_UTM" | "DUPLICATE_EVENT" | "STALE_ACCOUNT" | "METRIC_MISMATCH";
export const DATA_QUALITY_TYPE_LABELS: Record<DataQualityIssueType, string> = {
  SYNC_FAILURE: "Đồng bộ thất bại",
  MISSING_UTM: "Thiếu UTM",
  DUPLICATE_EVENT: "Trùng lặp",
  STALE_ACCOUNT: "Tài khoản không cập nhật",
  METRIC_MISMATCH: "Số liệu không khớp",
};

export type DataQualitySeverity = "LOW" | "MEDIUM" | "HIGH";
export const DATA_QUALITY_SEVERITY_LABELS: Record<DataQualitySeverity, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export type DataQualityStatus = "OPEN" | "RESOLVED" | "IGNORED";
export const DATA_QUALITY_STATUS_LABELS: Record<DataQualityStatus, string> = {
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  IGNORED: "Bỏ qua",
};
