# Phase 5 — Marketing

Trạng thái: **hoàn thành và đã verify trong Browser preview với dữ liệu thật**, bao
gồm cả một luồng thật sự công khai (khách vãng lai điền form trên trang `/lp/[slug]`
không cần đăng nhập, dữ liệu được ghi thẳng vào DB).

## Phạm vi đã làm

- Bảng: `Campaign`, `CampaignChannel`, `Content`, `ContentAsset`, `SocialAccount`,
  `SocialPost`, `LandingPage`, `LandingForm`, `FormSubmission`, `EmailCampaign`. Thêm
  `Lead.campaignId` (nullable, mở rộng bảng Phase 4) để tính KPI chiến dịch.
- Trang: Chiến dịch (`/marketing/campaigns`, `/marketing/campaigns/[campaignId]` —
  KPI thật + kênh + nội dung + lead liên kết), Content Hub (`/marketing/content` —
  board kéo-thả 8 giai đoạn, `/marketing/content/[contentId]` — chi tiết + tài
  nguyên), Social (`/marketing/social` — tài khoản + bài đăng), Landing Page
  (`/marketing/landing-pages`, `/marketing/landing-pages/[id]` — xem lượt đăng ký),
  Email Campaign (`/marketing/email`).
- Route công khai thật: `/lp/[slug]` (`app/lp/[slug]/page.tsx`, ngoài `(protected)`) —
  render headline/body/CTA + form thu lead, submit tạo `FormSubmission` thật, không
  cần đăng nhập.
- Permission mới: `campaigns.{read,create,update,delete}`, `content.{read,create,
  update,delete}`, `marketing_channels.{read,manage}` (gộp Social/Landing Page/Email
  Campaign dưới 1 cặp quyền, giống `sales_catalog.manage` ở Phase 4).

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Công thức KPI chiến dịch là thật, tính trên dữ liệu thật** (`services/marketing/
   campaigns.ts` → `computeKpis`): Spend luôn = 0 vì chưa có `ad_metrics_daily`
   (Phase 6) — không phải giả, chỉ là chưa có nguồn dữ liệu; Revenue = tổng
   `Order.totalAmount` (loại CANCELLED/REFUNDED) của khách hàng quy về qua
   `Lead.campaignId` → `Lead.customerId`; ROAS/CPL/CAC/Profit suy ra từ 2 số trên,
   tránh chia 0. Đã verify bằng cách gắn `campaignId` cho 1 lead đã có customer +
   order thật trong seed — Revenue/Orders/Leads hiện đúng số, không phải 0 giả.
   Attribution ở đây là 1 chạm (lead → campaign) — attribution đa chạm (first/last-
   touch) là việc của Phase 7 (Analytics).
2. **Content Hub board dùng cột cố định theo `ContentStatus`** (8 giai đoạn Idea→
   Brief→Script→Production→Review→Approved→Scheduled→Published) — cùng pattern
   KanbanBoard (Phase 2), không chặn chuyển ngược trạng thái (khác dependency Work
   Hub) vì nội dung có thể cần làm lại.
3. **Social posting và Email sending là thao tác thủ công, chưa gọi API thật** — cùng
   nhóm giới hạn với Google OAuth (Phase 1) và Ads (Phase 6): chưa có credential
   Meta/TikTok/provider email (Resend...). `SocialPost`/`EmailCampaign` chỉ đổi
   trạng thái khi user tự đăng/gửi thật trên nền tảng rồi đánh dấu lại — không giả
   vờ gọi API rồi luôn báo thành công.
4. **Landing page có form thu lead THẬT, không phải form-builder đầy đủ.** Mỗi
   landing page tự động có sẵn 1 `LandingForm` mặc định (Họ tên/Email/SĐT) khi tạo —
   không có UI kéo-thả field tuỳ biến (ngoài phạm vi roadmap). Trang công khai
   `/lp/[slug]` render thật, submit gọi Server Action `submitLandingFormAction`
   (không kiểm tra RBAC — đúng bản chất form công khai) ghi `FormSubmission` thật.
   Đã verify: điền form ở trang công khai → số "Đăng ký" ở trang quản trị tăng thật.
5. **`getPublishedLandingPageBySlugGlobal` tra theo slug KHÔNG kèm organizationId**
   vì route công khai không có session. `slug` chỉ unique trong 1 organization
   (`@@unique([organizationId, slug])`) — hệ thống hiện chỉ seed 1 organization nên
   không xung đột; nếu sau này multi-tenant thật với nhiều organization cùng dùng
   landing page công khai, cần thêm prefix org vào URL (vd `/lp/[orgSlug]/[slug]`).
6. **`marketing_channels.manage` gộp 3 domain** (Social/Landing Page/Email Campaign)
   dưới 1 permission — giống cách Phase 4 gộp `sales_catalog.manage`.

## Kiểm tra đã thực hiện (browser, dữ liệu seed + dữ liệu tự nhập thật)

1. `/marketing/campaigns/seed-campaign-1`: Spend 0đ (đúng, chưa có Ads), Revenue
   110.000.000đ (= 85tr đơn seed + 25tr đơn tạo tay ở Phase 4, đúng vì cùng khách
   hàng quy về từ lead của campaign này), ROAS 0.00x, Profit = Revenue, Leads 1,
   Orders 2, CPL/CAC = 0đ (đúng vì Spend = 0) — công thức đúng ngay cả khi verify
   chéo qua dữ liệu tạo ở phase trước.
2. Content Hub: kéo-thả "Ý tưởng livestream Q&A" từ Ý tưởng → Brief, reload vẫn giữ
   đúng cột (persist thật).
3. Social: đổi trạng thái bài đăng seed từ "Đã lên lịch" → "Đã đăng" qua Select,
   cập nhật ngay.
4. Landing Page: mở `/lp/ra-mat-q4` (không đăng nhập, tab ẩn danh riêng), điền form
   thật (Trần Thị Test / tranthitest@example.com / 0912345678), submit thành công,
   trang quản trị `/marketing/landing-pages/seed-landing-page-1` hiện đúng "Đăng ký
   (2)" gồm cả submission seed và submission vừa tạo.
5. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (43 route,
   gồm `/lp/[slug]` và `/marketing` index-redirect).

## Lỗi & cách sửa (trong lúc verify)

- **Middleware chặn nhầm trang công khai khi đã đăng nhập**: `proxy.ts` ban đầu coi
  `/lp` là "public path" cùng nhóm với `/login`/`/forgot-password`, áp dụng luôn quy
  tắc "đã đăng nhập thì đẩy về /dashboard" — khiến admin/staff đang đăng nhập
  (ở tab khác) không xem được trang `/lp/[slug]` của chính họ để preview. Sửa bằng
  cách tách `/lp` thành nhóm `OPEN_PATHS` riêng (luôn cho qua, không redirect theo
  trạng thái đăng nhập), khác nhóm `AUTH_PATHS` (`/login`, `/forgot-password` — vẫn
  đẩy về dashboard nếu đã đăng nhập, đúng hành vi cũ).

## Ghi chú môi trường

Không có gì khác biệt so với Phase 4 — Docker Postgres đã sẵn sàng, migration áp dụng
trực tiếp qua `prisma migrate dev`, không cần env var mới (email/social API key thật
sẽ là việc của phase tích hợp sau, tương tự Ads ở Phase 6).
