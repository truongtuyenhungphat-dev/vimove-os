import "server-only";

/**
 * IntegrationProvider (Phase 6) — theo đúng §3 rule 10 ("Mọi tích hợp bên ngoài đi
 * qua adapter, không gọi thẳng SDK provider trong route handler/service khác").
 * 4 provider thật (Meta/Google/TikTok/Zalo) implement cùng interface này; route
 * handler và service (`services/ads/*.ts`) chỉ biết tới interface, không import
 * SDK provider trực tiếp.
 *
 * CHƯA có app credential thật (Meta App ID/Secret, Google Ads Developer Token,
 * TikTok App, Zalo OA App — xem docs/00 §1.3.4) nên các phương thức gọi API thật của
 * cả 4 provider đều throw `AdsProviderNotConfiguredError` cho tới khi biến môi
 * trường tương ứng được thiết lập — cùng cách xử lý với Google OAuth login ở Phase 1
 * (code đầy đủ, nút ẩn/báo lỗi rõ ràng cho tới khi có credential thật, không giả vờ
 * thành công).
 */

export class AdsProviderNotConfiguredError extends Error {
  constructor(platform: string, missingEnvVars: string[]) {
    super(`${platform}: chưa cấu hình — thiếu biến môi trường ${missingEnvVars.join(", ")}`);
    this.name = "AdsProviderNotConfiguredError";
  }
}

export type AdAccountDTO = { externalId: string; name: string; currency: string; timezone: string };
export type AdCampaignDTO = { externalId: string; name: string; status: "ACTIVE" | "PAUSED" | "ARCHIVED"; dailyBudget: number | null };
export type AdMetricDTO = { campaignExternalId: string; date: string; impressions: number; clicks: number; spend: number; conversions: number };
export type OAuthTokenResult = { accessToken: string; refreshToken: string | null; expiresAt: Date | null };

export interface AdsIntegrationProvider {
  readonly platform: "META" | "GOOGLE" | "TIKTOK" | "ZALO";
  /** true khi đủ biến môi trường (App ID/Secret...) để bắt đầu OAuth thật. */
  isConfigured(): boolean;
  /** Sinh URL đưa user sang trang cấp quyền của provider. `state` dùng chống CSRF. */
  getAuthorizationUrl(state: string, redirectUri: string): string;
  /** Đổi authorization code (callback OAuth) lấy access/refresh token thật. */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResult>;
  /** Danh sách ad account mà token có quyền truy cập. */
  fetchAdAccounts(accessToken: string): Promise<AdAccountDTO[]>;
  fetchCampaigns(accessToken: string, adAccountExternalId: string): Promise<AdCampaignDTO[]>;
  /** Metrics theo ngày cho 1 khoảng thời gian — dùng cho sync job. */
  fetchDailyMetrics(accessToken: string, adAccountExternalId: string, from: Date, to: Date): Promise<AdMetricDTO[]>;
}

function unconfiguredProvider(platform: AdsIntegrationProvider["platform"], envVars: string[]): AdsIntegrationProvider {
  function assertConfigured(): never {
    throw new AdsProviderNotConfiguredError(platform, envVars);
  }
  return {
    platform,
    isConfigured: () => envVars.every((key) => !!process.env[key]),
    getAuthorizationUrl: assertConfigured,
    exchangeCodeForToken: async () => assertConfigured(),
    fetchAdAccounts: async () => assertConfigured(),
    fetchCampaigns: async () => assertConfigured(),
    fetchDailyMetrics: async () => assertConfigured(),
  };
}

/**
 * Mỗi provider thật sẽ implement `getAuthorizationUrl`/`exchangeCodeForToken`/
 * `fetch*` bằng SDK/REST API riêng của nền tảng đó khi có credential — hiện tại tất
 * cả đều là "chưa cấu hình" (không giả lập trả dữ liệu ảo). `isConfigured()` vẫn kiểm
 * tra thật để UI biết lúc nào hiện nút "Kết nối".
 */
export const metaAdsProvider: AdsIntegrationProvider = unconfiguredProvider("META", ["META_APP_ID", "META_APP_SECRET"]);
export const googleAdsProvider: AdsIntegrationProvider = unconfiguredProvider("GOOGLE", [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
]);
export const tiktokAdsProvider: AdsIntegrationProvider = unconfiguredProvider("TIKTOK", ["TIKTOK_APP_ID", "TIKTOK_APP_SECRET"]);
export const zaloAdsProvider: AdsIntegrationProvider = unconfiguredProvider("ZALO", ["ZALO_APP_ID", "ZALO_APP_SECRET"]);

export const AD_PROVIDERS: Record<"META" | "GOOGLE" | "TIKTOK" | "ZALO", AdsIntegrationProvider> = {
  META: metaAdsProvider,
  GOOGLE: googleAdsProvider,
  TIKTOK: tiktokAdsProvider,
  ZALO: zaloAdsProvider,
};
