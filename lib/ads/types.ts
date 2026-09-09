// Type union + nhãn hiển thị cho Ads Integration (Phase 6).

export type AdPlatform = "META" | "GOOGLE" | "TIKTOK" | "ZALO";
export const AD_PLATFORMS: AdPlatform[] = ["META", "GOOGLE", "TIKTOK", "ZALO"];
export const AD_PLATFORM_LABELS: Record<AdPlatform, string> = {
  META: "Meta (Facebook/Instagram)",
  GOOGLE: "Google Ads",
  TIKTOK: "TikTok Ads",
  ZALO: "Zalo Ads",
};

export type AdConnectionStatus = "PENDING" | "CONNECTED" | "ERROR" | "DISCONNECTED";
export const AD_CONNECTION_STATUS_LABELS: Record<AdConnectionStatus, string> = {
  PENDING: "Chưa kết nối",
  CONNECTED: "Đã kết nối",
  ERROR: "Lỗi kết nối",
  DISCONNECTED: "Đã ngắt kết nối",
};

export type AdEntityStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export const AD_ENTITY_STATUS_LABELS: Record<AdEntityStatus, string> = {
  ACTIVE: "Đang chạy",
  PAUSED: "Tạm dừng",
  ARCHIVED: "Lưu trữ",
};
