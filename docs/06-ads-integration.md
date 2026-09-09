# Phase 6 — Ads Integration

Trạng thái: **code xong, chưa verify được với sandbox thật** — đúng như đã thông báo
trước khi bắt đầu phase này. Chưa có app credential thật (Meta App ID/Secret, Google
Ads Developer Token, TikTok App, Zalo OA App — xem `docs/00-phuong-an-trien-khai.md`
§1.3 mục 4). Phần có thể verify độc lập với credential thật (mã hoá token, schema,
tính idempotent của sync, công thức CTR/CPC/CPM) đã được kiểm tra và xác nhận đúng.

## Phạm vi đã làm

- Bảng: `AdConnection`, `AdAccount`, `AdCampaign`, `AdAdSet`, `Ad`, `AdCreative`,
  `AdMetricDaily`.
- `lib/integrations/ads/provider.ts` — interface `AdsIntegrationProvider` +
  `metaAdsProvider`/`googleAdsProvider`/`tiktokAdsProvider`/`zaloAdsProvider`. Mỗi
  provider có `isConfigured()` (kiểm tra biến môi trường thật) và các method gọi API
  thật (`getAuthorizationUrl`, `exchangeCodeForToken`, `fetchAdAccounts`,
  `fetchCampaigns`, `fetchDailyMetrics`) — throw `AdsProviderNotConfiguredError` rõ
  ràng cho tới khi có credential, không giả lập trả dữ liệu ảo.
- `lib/integrations/encryption.ts` — mã hoá/giải mã token bằng AES-256-GCM
  (`ENCRYPTION_KEY` trong `.env`) — **đã verify độc lập bằng round-trip
  encrypt/decrypt thật**, không phụ thuộc OAuth.
- Trang: Tích hợp quảng cáo (`/integrations/ads`) — 4 thẻ provider (trạng thái kết
  nối, nút Kết nối/Đồng bộ/Ngắt kết nối) + bảng tổng hợp hiệu suất theo ad account.
- Permission mới: `ads.read`, `ads.manage`.

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Không giả vờ kết nối thành công.** Nút "Kết nối" ở mỗi provider **thật sự bị
   `disabled`** (đã verify qua `button.disabled === true` trong browser) khi
   `isConfigured()` trả `false` — đúng cách Google OAuth login xử lý ở Phase 1
   (README: "code đã sẵn sàng nhưng ẩn nút cho tới khi có credential thật"). Không có
   trạng thái "đã kết nối" giả nào được seed — trang luôn hiện đúng thực tế: chưa kết
   nối được provider nào.
2. **`AdMetricDaily` bắt buộc gắn với `AdCampaign`** (`adCampaignId` không nullable),
   khác thiết kế ban đầu có ý định cho phép dòng "tổng cấp tài khoản" — lý do: Postgres
   coi nhiều giá trị NULL trong cột có `@@unique` là "khác nhau nhau", nên nếu
   `adCampaignId` nullable thì mất tính idempotent cho dòng cấp tài khoản (nghiệm thu
   yêu cầu "sync job idempotent — chạy lại không tạo trùng"). Giải pháp: chỉ lưu
   metrics ở cấp campaign; tổng theo account tính bằng `SUM` qua các campaign
   (`services/ads/dashboard.ts`).
3. **Idempotency dựa vào `@@unique`** trên cả 3 cấp: `AdAccount(connectionId,
   externalId)`, `AdCampaign(adAccountId, externalId)`, `AdMetricDaily(adCampaignId,
   date)`. `services/ads/sync.ts` dùng `upsert` (không phải `create`) cho cả 3 —
   chạy lại sync cùng ngày chỉ update, không tạo dòng trùng. Logic này đúng về mặt
   thiết kế nhưng chưa chạy được với dữ liệu thật từ provider (chưa có credential).
4. **Token mã hoá bằng AES-256-GCM, không lưu plaintext.** `ENCRYPTION_KEY` (bất kỳ
   chuỗi nào) được đưa qua `scrypt` để ra khoá 32-byte đúng chuẩn AES-256 — người vận
   hành không cần tự tạo khoá đúng định dạng. Đã tạo `ENCRYPTION_KEY` dev trong
   `.env` và verify bằng script Node độc lập: mã hoá 1 access token giả, xác nhận
   ciphertext không lộ plaintext, giải mã lại đúng 100% (xem lịch sử phiên làm việc —
   không lưu script này vào repo vì chỉ là kiểm tra tạm thời).
5. **`syncConnection` yêu cầu `status === "CONNECTED"` và có `encryptedAccessToken`**
   trước khi gọi provider — vì không thể đạt trạng thái này khi chưa có OAuth thật,
   hàm này chưa từng được thực thi thành công trong môi trường hiện tại (chỉ được
   review code, không phải chạy thật) — ghi rõ để không hiểu nhầm là đã kiểm thử.
6. **`AdEntityStatus` dùng chung cho Campaign/AdSet/Ad** (ACTIVE/PAUSED/ARCHIVED) —
   đơn giản hoá, không tách enum riêng cho từng cấp vì ý nghĩa giống nhau.
7. **Shopee/TikTok Shop/Pancake chưa làm** — roadmap ghi "nếu cần ở phase này hoặc
   sau", chưa có yêu cầu cụ thể nên để dành cho phase tích hợp sau, tránh xây trước
   khi cần (đúng tinh thần §3 rule 6).

## Kiểm tra đã thực hiện

1. `/integrations/ads`: cả 4 thẻ provider hiện đúng "Chưa kết nối", đúng thông báo
   thiếu biến môi trường, nút "Kết nối" thật sự `disabled` (verify qua
   `document.querySelectorAll('button')` trong console — không chỉ nhìn giao diện).
   Bảng hiệu suất hiện đúng Empty State (chưa có `AdAccount`/`AdMetricDaily` nào —
   không seed dữ liệu giả).
2. Mã hoá token: verify độc lập bằng round-trip thật (xem quyết định #4).
3. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (45 route,
   gồm `/integrations` và `/integrations/ads`).

## Việc còn lại trước khi dùng thật

1. Tạo Meta App (developers.facebook.com), Google Ads OAuth Client + Developer
   Token, TikTok for Business App, Zalo OA App — điền `META_APP_ID`/`META_APP_SECRET`,
   `GOOGLE_ADS_CLIENT_ID`/`GOOGLE_ADS_CLIENT_SECRET`/`GOOGLE_ADS_DEVELOPER_TOKEN`,
   `TIKTOK_APP_ID`/`TIKTOK_APP_SECRET`, `ZALO_APP_ID`/`ZALO_APP_SECRET` vào `.env`
   (xem `.env.example`).
2. Implement thật `getAuthorizationUrl`/`exchangeCodeForToken`/`fetch*` trong từng
   file provider (hiện là stub throw lỗi) bằng SDK/REST API thật của từng nền tảng.
3. Tạo route handler callback OAuth (`app/api/integrations/ads/[platform]/callback/
   route.ts` — chưa tồn tại, `startConnect()` đã trỏ sẵn `redirectUri` tới đây) để
   nhận `code`, gọi `exchangeCodeForToken`, mã hoá token bằng
   `lib/integrations/encryption.ts`, lưu `AdConnection` với `status: CONNECTED`.
4. Thêm scheduled sync thật (Vercel Cron gọi `syncConnection` định kỳ cho mọi
   connection `CONNECTED`) — hiện chỉ có nút "Đồng bộ" thủ công.
5. Verify lại toàn bộ nghiệm thu Phase 6 với sandbox thật của từng provider.

## Ghi chú môi trường

`ENCRYPTION_KEY` đã được thêm vào `.env` (giá trị dev ngẫu nhiên, không dùng cho
production) để `lib/integrations/encryption.ts` hoạt động — không có giá trị này,
mọi thao tác liên quan token sẽ throw lỗi rõ ràng ngay từ đầu thay vì lỗi mơ hồ.
