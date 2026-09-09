# Phase 7 — Analytics

Trạng thái: **hoàn thành và đã verify trong Browser preview với dữ liệu thật**, bao
gồm một luồng attribution thật đi từ lượt truy cập landing page công khai (có UTM)
tới sự kiện chuyển đổi, tính first-touch/last-touch chính xác.

## Phạm vi đã làm

- Bảng: `Event`, `AttributionTouchpoint`, `AttributionEvent`, `DailyMetric`, `Report`,
  `ReportWidget`, `DataQualityIssue`.
- Attribution: ghi touchpoint UTM thật mỗi lượt truy cập `/lp/[slug]` (Route Handler
  `app/api/lp/track/route.ts` — nơi duy nhất được phép set cookie visitorId), gán
  first-touch/last-touch khi có chuyển đổi (submit form), idempotency qua
  `idempotencyKey` = id submission.
- Dashboard: `/analytics` — 6 tab Executive/Work/Marketing/Ads/Sales/Content, toàn bộ
  số liệu tính trên dữ liệu tổ chức thật (Lead/Order/Task/Content/Campaign/Ads).
- Report Builder: `/analytics/reports` (+ `/analytics/reports/[reportId]`) —
  Dataset→Dimension→Metric→Filter→Visualization, xuất CSV thật.
- Data Quality Hub: `/analytics/data-quality` — 5 detector thật, nút "Quét lại" thủ
  công (chưa có cron).
- Permission mới: `analytics.read`, `analytics.manage`.

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **`Event` là log nghiệp vụ nội bộ** (lead.created/lead.won/order.created), ghi từ
   service layer (`services/crm/leads.ts`, `services/sales/orders.ts`) qua
   `writeEvent()` — idempotent theo `idempotencyKey` mặc định `${type}:${entityId}`
   (upsert, không tạo trùng nếu gọi lại). **Chỉ áp dụng từ thời điểm code này tồn
   tại** — dữ liệu seed chèn thẳng qua `prisma.lead.create()`/`prisma.order.create()`
   (bỏ qua service layer) nên KHÔNG có Event tương ứng; đã verify điều này khi thấy
   "0 lead mới" trong 30 ngày dù có 4 lead seed — đúng hành vi, không phải bug.
2. **Attribution chỉ áp dụng cho `/lp/[slug]`** — nơi duy nhất UTM thật sự tồn tại.
   Route Handler (không phải Server Component) ghi cookie `vimove_visitor_id` vì
   Server Component không được phép set cookie khi render — đây là lý do tại sao
   route tracking tách riêng khỏi `page.tsx` (`components/marketing/track-visit.tsx`
   bắn 1 beacon `fetch` lúc mount). Server Action `submitLandingFormAction` đọc lại
   cookie này (Server Action được phép đọc cookie) để gán first/last-touch.
3. **First-touch có thể là "(không rõ nguồn)" một cách chính đáng** — nếu lượt truy
   cập sớm nhất của visitor đó không có UTM (vd gõ thẳng URL). Đã verify thật: visitor
   ghé trang lần đầu không UTM, lần 2 có `utm_source=facebook` rồi mới submit — hệ
   thống đúng đắn gán first-touch = lượt không UTM, last-touch = lượt có UTM
   (`firstTouchpointId` ≠ `lastTouchpointId`), không nhầm lẫn 2 khái niệm.
4. **`DailyMetric.spend` luôn 0** — chưa nối Ads (Phase 6), giống mọi chỗ khác dùng
   Spend trong hệ thống. Nút "Tính lại số liệu" là thủ công, chưa có cron.
5. **Report Builder chỉ cho chọn Bảng/Cột (TABLE/BAR)** ở UI thêm widget — enum
   `ReportVisualization` vẫn có LINE/PIE cho tương lai nhưng CHƯA render thật, nên
   không đưa vào lựa chọn (đúng §3 rule 6: không cho chọn cái chưa hoạt động). Dataset
   dùng cách nạp toàn bộ dữ liệu rồi nhóm ở tầng ứng dụng (không phải
   `prisma.groupBy` thuần) vì cần nhóm theo field của quan hệ (tên stage, tên
   owner...) — `groupBy` của Prisma không group được theo field quan hệ.
6. **Export chỉ có CSV thật** — không thêm dependency XLSX/PDF ở phase này (cân nhắc
   effort vs lợi ích khi đã có CSV mở được bằng Excel). "Lên lịch gửi report qua
   email" **chưa làm** — cùng nhóm giới hạn với EmailCampaign Phase 5 (chưa có
   provider email thật).
7. **Data Quality Hub — 5 detector, đều đọc dữ liệu thật, không detector nào tạo
   issue giả:**
   - `SYNC_FAILURE`: `AdConnection.status === ERROR`.
   - `STALE_ACCOUNT`: `AdConnection` CONNECTED nhưng `lastSyncedAt` quá 2 ngày.
   - `MISSING_UTM`: `LandingPage` đã publish nhưng 0 `AttributionTouchpoint`.
   - `DUPLICATE_EVENT`: 2 `FormSubmission` cùng data, cùng form, cách nhau < 5 phút.
   - `METRIC_MISMATCH`: `Campaign` ACTIVE có budget, chạy ≥ 7 ngày, nhưng **toàn tổ
     chức** chưa ghi nhận Spend thật nào từ `AdMetricDaily`. Lưu ý: `Campaign`
     (marketing) và `AdCampaign` (nền tảng ads) là 2 thực thể chưa có liên kết trực
     tiếp trong schema — nên đây là so sánh ở mức tổ chức, không phải đối chiếu đúng
     spend của từng chiến dịch cụ thể (ghi rõ trong code, tránh hiểu nhầm).
   - Issue cũ không còn tái hiện ở lần quét sau tự chuyển `RESOLVED` (không trôi nổi
     mãi ở trạng thái mở).

## Kiểm tra đã thực hiện (browser, dữ liệu thật)

1. Dashboard `/analytics`: cả 6 tab hiện đúng số liệu thật (users/leads/win rate/
   pipeline value ở Executive; revenue/orders ở trend chart sau khi bấm "Tính lại số
   liệu"). Sparkline SVG tự viết (không thêm thư viện) render đúng.
2. Attribution thật: mở `/lp/ra-mat-q4?utm_source=facebook&utm_medium=cpc&utm_campaign=q4_launch`
   ở tab ẩn danh mới → xác nhận `POST /api/lp/track` trả 200 (Network tab) → submit
   form → verify trực tiếp trong DB: `AttributionEvent` có `firstTouchpointId` và
   `lastTouchpointId` trỏ đúng 2 touchpoint khác nhau theo đúng thời gian thật.
3. Data Quality Hub: bấm "Quét lại" → phát hiện đúng 1 issue `METRIC_MISMATCH` cho
   `seed-campaign-1` (thoả nghiệm thu "tự phát hiện được ít nhất 1 case seed sẵn") →
   bấm "Đã xử lý" → issue chuyển đúng sang tab "Đã xử lý".
4. Report Builder: tạo report "Lead theo nguồn" → thêm widget Lead/Nguồn/Số lượng/
   Cột → hiện đúng dữ liệu thật (WEBSITE: 1, ADS: 1...) dạng cột ngang.
5. **Phát hiện + sửa 1 bug thật trong lúc verify**: 8 dialog (`WidgetDialog`,
   `ReportDialog`, `CustomerDialog`, `ProductDialog`, `ChannelDialog`,
   `RequestApprovalDialog`, `EmailCampaignDialog`, `SocialAccountDialog`,
   `SocialPostDialog`) thiếu `max-h-[85vh] overflow-y-auto` trên `DialogContent` —
   ở viewport thấp, nút submit bị tràn ra ngoài không cách nào bấm được. Đã thêm class
   còn thiếu cho cả 9 file, đồng bộ với các dialog khác đã làm đúng từ trước.
6. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (49 route, gồm
   `/analytics`, `/analytics/reports(+ [reportId])`, `/analytics/data-quality`,
   `/api/lp/track`).

## Ghi chú môi trường

Không cần env var mới. Không có gì khác biệt so với Phase 6 về hạ tầng.
