// Type union + nhãn hiển thị cho Marketing (Phase 5).

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export const CAMPAIGN_STATUSES: CampaignStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang chạy",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
};

export type MarketingChannelType = "FACEBOOK" | "GOOGLE" | "TIKTOK" | "ZALO" | "EMAIL" | "ORGANIC" | "REFERRAL" | "OTHER";
export const MARKETING_CHANNEL_TYPES: MarketingChannelType[] = ["FACEBOOK", "GOOGLE", "TIKTOK", "ZALO", "EMAIL", "ORGANIC", "REFERRAL", "OTHER"];
export const MARKETING_CHANNEL_TYPE_LABELS: Record<MarketingChannelType, string> = {
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  TIKTOK: "TikTok",
  ZALO: "Zalo",
  EMAIL: "Email",
  ORGANIC: "Organic",
  REFERRAL: "Giới thiệu",
  OTHER: "Khác",
};

export type ContentType = "ARTICLE" | "VIDEO" | "IMAGE" | "SOCIAL_POST" | "EMAIL" | "OTHER";
export const CONTENT_TYPES: ContentType[] = ["ARTICLE", "VIDEO", "IMAGE", "SOCIAL_POST", "EMAIL", "OTHER"];
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "Bài viết",
  VIDEO: "Video",
  IMAGE: "Hình ảnh",
  SOCIAL_POST: "Bài đăng MXH",
  EMAIL: "Email",
  OTHER: "Khác",
};

export type ContentStatus = "IDEA" | "BRIEF" | "SCRIPT" | "PRODUCTION" | "REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED";
export const CONTENT_STATUSES: ContentStatus[] = ["IDEA", "BRIEF", "SCRIPT", "PRODUCTION", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"];
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: "Ý tưởng",
  BRIEF: "Brief",
  SCRIPT: "Kịch bản",
  PRODUCTION: "Sản xuất",
  REVIEW: "Review",
  APPROVED: "Đã duyệt",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã đăng",
};

export type SocialPlatform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "ZALO" | "OTHER";
export const SOCIAL_PLATFORMS: SocialPlatform[] = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE", "ZALO", "OTHER"];
export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  ZALO: "Zalo",
  OTHER: "Khác",
};

export type SocialPostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
export const SOCIAL_POST_STATUSES: SocialPostStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];
export const SOCIAL_POST_STATUS_LABELS: Record<SocialPostStatus, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã đăng",
  FAILED: "Thất bại",
};

export type LandingPageStatus = "DRAFT" | "PUBLISHED";
export const LANDING_PAGE_STATUSES: LandingPageStatus[] = ["DRAFT", "PUBLISHED"];
export const LANDING_PAGE_STATUS_LABELS: Record<LandingPageStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
};

export type EmailCampaignStatus = "DRAFT" | "SCHEDULED" | "SENT";
export const EMAIL_CAMPAIGN_STATUSES: EmailCampaignStatus[] = ["DRAFT", "SCHEDULED", "SENT"];
export const EMAIL_CAMPAIGN_STATUS_LABELS: Record<EmailCampaignStatus, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  SENT: "Đã gửi",
};
