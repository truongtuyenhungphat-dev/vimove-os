# Phase 8 — AI Command Center

Trạng thái: **AI Work Assistant code xong, chưa verify được API Claude thật** (chưa có
`ANTHROPIC_API_KEY` trong môi trường này — đã thông báo trước, đúng nhóm giới hạn với
Ads Phase 6). **NHƯNG luồng Insight→Recommendation→Approval→Action→Result→Audit Log
đã verify đầy đủ trong Browser preview, với 1 hành động nhạy cảm thật sự làm thay đổi
dữ liệu tổ chức** (tạm dừng chiến dịch) — phần này không phụ thuộc Claude API.

## Phạm vi đã làm

- Bảng: `AiConversation`, `AiMessage`, `AiInsight`, `AiRecommendation`, `AiAction`,
  `AiActionLog`.
- Thêm dependency `@anthropic-ai/sdk` (đúng quyết định nền tảng "AI provider =
  Claude").
- `lib/integrations/ai/claude.ts` — wrapper gọi Claude Messages API thật
  (`askAssistant`, `summarizeInsight`), `isAiConfigured()` kiểm tra
  `ANTHROPIC_API_KEY`, throw `AiNotConfiguredError` rõ ràng nếu chưa có (không giả
  lập trả lời).
- `services/ai/context.ts` — dựng system prompt CHỈ gồm dữ liệu user hiện tại có
  quyền xem (kiểm tra từng `hasPermission()` trước khi thêm khối dữ liệu tương ứng).
- AI Work Assistant: `/ai/assistant` — chat UI thật, lưu `AiMessage` cho cả câu hỏi
  lẫn câu trả lời.
- AI Insights (Manager + Marketing Analyst): `/ai/insights` — 3 heuristic thật
  (WORK_BOTTLENECK, PROJECT_HEALTH, MARKETING_ANOMALY), nút "Tạo insight mới".
- Approval Queue: `/ai/recommendations` — duyệt/từ chối đề xuất, log đầy đủ từng
  bước.
- Permission mới: `ai.read`, `ai.manage`.

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Insight/Recommendation KHÔNG cần Claude API để hoạt động.** 3 loại insight đều
   tính bằng heuristic thật trên dữ liệu tổ chức (task quá hạn theo assignee,
   milestone trễ hạn, chiến dịch chạy lâu không có lead) — `evidence` (JSON) luôn là
   số liệu thật. `summarizeInsight()` chỉ **thêm** mô tả tự nhiên hơn nếu có cấu hình
   Claude — có fallback template tiếng Việt an toàn nếu chưa cấu hình, KHÔNG throw
   (khác `askAssistant` — throw vì chat không có gì để fallback).
2. **Chỉ 1 loại action nhạy cảm thật: `PAUSE_CAMPAIGN`** (gọi thẳng
   `services/marketing/campaigns.ts#updateCampaign` đã có từ Phase 5, đổi
   `status: PAUSED`) — đúng nghiệm thu "mọi AI action nhạy cảm chỉ thực thi sau khi
   user bấm duyệt, có log đầy đủ". `AiActionType.REVIEW_CAMPAIGN` có trong enum cho
   tương lai nhưng CHƯA dùng — insight không dẫn tới thay đổi trạng thái thì chỉ hiển
   thị thông tin ở `/ai/insights`, không tạo `AiRecommendation` (đề xuất chỉ tồn tại
   khi có hành động thật để thực thi).
3. **`approveRecommendation` gộp cả duyệt + thực thi trong 1 luồng** (không có bước
   "đã duyệt nhưng chờ thực thi" lửng lơ) — tạo `AiAction` (PENDING) → ghi
   `AiActionLog` → gọi `executeAction()` thật → cập nhật `AiAction`/`AiRecommendation`
   theo kết quả thật (SUCCEEDED/FAILED) → ghi thêm `AiActionLog` kết quả. Nếu
   `executeAction` throw, `AiAction.status = FAILED` với `resultMessage` là lỗi thật —
   không có nhánh nào âm thầm nuốt lỗi.
4. **`buildUserContext` là nguồn duy nhất quyết định AI biết gì** — mỗi khối dữ liệu
   (Work/CRM/Sales/Marketing) chỉ được thêm nếu `hasPermission(session, "...")` đúng
   permission tương ứng. Không có "chế độ admin" nào bỏ qua kiểm tra này — đúng
   nghiệm thu "AI trả lời đúng phạm vi quyền của user hỏi".
5. **Model dùng `claude-sonnet-5`** (đúng model mới nhất theo hướng dẫn môi trường).

## Kiểm tra đã thực hiện (browser, dữ liệu thật)

1. **AI Insights**: bấm "Tạo insight mới" trên dữ liệu seed → 0 insight (đúng, vì
   seed không có case nào vi phạm ngưỡng — task không đủ quá hạn theo 1 assignee,
   milestone chưa tới hạn, campaign seed đã có lead thật). Tạo thêm 1 campaign test
   ("Demo AI Pause Test", ACTIVE, `startAt` 20 ngày trước, 0 lead) → quét lại → phát
   hiện đúng 1 insight `MARKETING_ANOMALY` (Cao) với evidence thật (20 ngày ≥ 14
   ngưỡng) → tự tạo 1 `AiRecommendation` PAUSE_CAMPAIGN.
2. **Approval Queue**: mở đề xuất "Tạm dừng chiến dịch 'Demo AI Pause Test'" → bấm
   "Duyệt & thực thi" → trạng thái chuyển "Đã thực thi", kết quả "Thành công", log
   hiện đủ 2 dòng ("Đã duyệt bởi người dùng — chuẩn bị thực thi PAUSE_CAMPAIGN" →
   "Thành công: Đã tạm dừng chiến dịch..."). Mở lại trang chi tiết chiến dịch — xác
   nhận **`status` thật sự đổi thành PAUSED** (badge "Tạm dừng") — chứng minh action
   không phải hiệu ứng UI giả, dữ liệu Campaign thật đã đổi.
3. **AI Work Assistant**: mở trang → thấy đúng banner "Chưa cấu hình
   ANTHROPIC_API_KEY". Tạo hội thoại mới, gửi câu hỏi "Tôi có bao nhiêu việc quá
   hạn?" → Server Action trả lỗi thật (Network tab: `500`), toast hiện đúng thông báo
   lỗi. Reload lại trang — xác nhận câu hỏi của user **đã được lưu thật**
   (`AiMessage` role USER) nhưng KHÔNG có câu trả lời giả nào xuất hiện — đúng hành
   vi: lưu câu hỏi trước, gọi Claude thất bại, không nuốt lỗi thành công giả.
4. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (53 route,
   gồm `/ai`, `/ai/assistant`, `/ai/insights`, `/ai/recommendations`).

## Việc còn lại trước khi dùng thật

1. Điền `ANTHROPIC_API_KEY` vào `.env` (xem `.env.example`).
2. Verify lại AI Work Assistant với câu hỏi thật — xác nhận Claude trả lời đúng
   phạm vi context được cung cấp, không bịa số liệu ngoài context.
3. Cân nhắc bật `summarizeInsight()` thật (tự động chạy khi có key) để insight có mô
   tả tự nhiên hơn thay vì template cố định.
4. Nếu cần thêm loại action nhạy cảm khác (đổi ngân sách, dừng ads...) — thêm vào
   `AiActionType` + nhánh xử lý tương ứng trong `executeAction()`
   (`services/ai/recommendations.ts`), giữ nguyên khung Insight→Recommendation→
   Approval→Action→Log đã có.

## Ghi chú môi trường

Đã cài `@anthropic-ai/sdk` (dependency mới, cần thiết theo đúng quyết định nền tảng
"AI provider = Claude"). `ANTHROPIC_API_KEY` chưa có trong `.env` — mọi lời gọi
`askAssistant()` sẽ throw `AiNotConfiguredError` cho tới khi được thiết lập.
