# Phase 9 — Optimization

Trạng thái: **Xong, verify đầy đủ trong Browser preview** — cả 2 hạng mục (Automation
Engine tự động trigger + AI Budget Optimization) đều KHÔNG phụ thuộc credential nào
còn thiếu (không giống Ads Phase 6 / Claude API Phase 8), nên được chứng minh
end-to-end bằng dữ liệu thật, không có phần nào "code xong nhưng chưa verify được".

## Phạm vi đã làm

- Schema: thêm `Workflow.triggerEventType String?` (+ index
  `[organizationId, triggerEventType, isActive]`), enum `AiInsightType` thêm
  `BUDGET_OPTIMIZATION`, enum `AiActionType` thêm `ADJUST_BUDGET`,
  `AiRecommendation.payload Json?`. Migration `20260909092554_optimization_automation`.
- `services/process/automation.ts` (mới) — `triggerWorkflowsForEvent()`: tìm mọi
  workflow đã publish + đang active có `triggerEventType` khớp event, gọi
  `startWorkflowRun()` (đã có từ Phase 3) cho từng workflow khớp, lỗi từng workflow bị
  nuốt riêng lẻ (tự động hoá không được phép làm hỏng hành động nghiệp vụ gốc).
- `services/analytics/events.ts#writeEvent()` viết lại: phân biệt "event thật sự mới"
  (bắt lỗi Prisma `P2002` trên `idempotencyKey` unique) với việc ghi đè event cũ — CHỈ
  event mới mới gọi `triggerWorkflowsForEvent()`. Đây là cơ chế bảo đảm mỗi event
  nghiệp vụ chỉ trigger automation đúng 1 lần (exactly-once), không phụ thuộc việc gọi
  lại `writeEvent()` nhiều lần từ cùng 1 hành động.
- Domain mới ghi event để làm trigger: `task.created` (`services/tasks/tasks.ts`),
  `campaign.created` (`services/marketing/campaigns.ts`) — cộng với `lead.created`,
  `lead.won`, `order.created` đã có từ Phase 7.
- UI Workflow Builder: `components/process/trigger-event-select.tsx` (chọn event
  trigger tự động hoặc "Chỉ chạy thủ công"), badge "Tự động: {event}" trên danh sách
  workflow, `setTriggerEventType()` action.
- `services/ai/insights.ts` — heuristic thứ 4: `BUDGET_OPTIMIZATION`, so sánh
  cost-per-lead giữa các chiến dịch ACTIVE có `budget` và ≥ 1 lead, đề xuất
  `ADJUST_BUDGET` khi chiến dịch tệ nhất tốn ≥ 1.5x chiến dịch tốt nhất.
- `services/ai/recommendations.ts#executeAction()` — nhánh `ADJUST_BUDGET`: đọc
  `newBudget` từ `payload`, gọi thẳng `updateCampaign()` đã có từ Phase 5 (đúng khung
  Insight→Recommendation→Approval→Action→Log của Phase 8, chỉ thêm 1 actionType mới).
- Fix nhỏ: `workflow-create-dialog.tsx` thêm `max-h-[85vh] overflow-y-auto` (đồng bộ
  với fix 9 dialog ở Phase 7).
- Không có permission mới (dùng lại `workflows.manage`, `ai.manage` đã có), không có
  route mới, không có biến môi trường mới.

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Không xây "Automation Engine" song song.** Roadmap dùng tên đó nhưng Phase 3 đã
   có đủ TRIGGER/ACTION/CONDITION/APPROVAL/WEBHOOK/PARALLEL execution + `WorkflowRun`/
   `WorkflowRunStep` làm execution log — cái duy nhất còn thiếu là cơ chế **tự động**
   gọi `startWorkflowRun()` từ 1 sự kiện nghiệp vụ thật, thay vì luôn cần bấm "Chạy
   thử". Phase 9 chỉ thêm phần thiếu đó (`triggerEventType` + `automation.ts`), không
   viết lại engine.
2. **`AUTOMATION_EVENT_TYPES` là danh sách đóng, khớp đúng những gì `writeEvent()`
   thực sự ghi** (`lib/process/types.ts`) — thêm domain mới chỉ cần domain đó gọi
   `writeEvent()` với type mới rồi thêm 1 dòng vào danh sách này, không phải sửa
   `automation.ts`.
3. **Idempotency của trigger dựa vào `Event.idempotencyKey` unique, không dựa vào
   logic ở tầng gọi.** `writeEvent()` mặc định `idempotencyKey = "{type}:{entityId}"`
   nếu người gọi không truyền — nghĩa là gọi lại `writeEvent()` nhiều lần cho cùng 1
   entity (vd double-submit) chỉ update event, không trigger lại workflow.
4. **Budget Optimization CHỈ dùng `Campaign.budget` (ngân sách dự kiến) làm proxy chi
   phí — cố ý KHÔNG tối ưu creative/audience**, vì dữ liệu Spend/hiệu suất quảng cáo
   thật (`AdMetricDaily`, Phase 6) chưa verify được do thiếu OAuth credentials. Giới
   hạn này ghi rõ trong docstring `executeAction()` và trong mô tả insight hiển thị
   cho user ("Ước lượng theo ngân sách dự kiến, chưa có Spend thật"). Khi Phase 6 có
   dữ liệu Ads thật, chỉ cần đổi nguồn `costPerLead` sang Spend thật, không đổi luồng
   Insight→Recommendation→Approval→Action.
5. **`ADJUST_BUDGET` tái dùng `updateCampaign()` nguyên vẹn** (không có đường ghi
   `budget` tắt riêng cho AI) — mọi ràng buộc/validation của service đó áp dụng cho cả
   2 nguồn gọi (form Sửa chiến dịch và AI approval), đúng nguyên tắc "Server Actions
   không gọi Prisma trực tiếp, luôn qua service layer".

## Kiểm tra đã thực hiện (browser, dữ liệu thật)

1. **Automation Engine — trigger tự động, không bấm "Chạy thử"**:
   - Đổi `triggerEventType` của `seed-workflow-1` thành `task.created` qua UI mới.
   - Tạo task mới "Task kiem tra Automation Engine" ở `/work/tasks` → chuông thông báo
     tăng 2 → 3 ngay lập tức.
   - Mở lại `/process/workflows/seed-workflow-1` → thấy `WorkflowRun` mới
     ("Thành công") xuất hiện trên cùng danh sách chạy thủ công trước đó, KHÔNG có
     thao tác "Chạy thử" nào.
   - Mở `/dashboard/notifications` → thấy thông báo "Workflow demo đã chạy" mới nhất —
     xác nhận node `ACTION` (`createNotification()`) thật sự chạy như hệ quả của
     trigger tự động.
2. **AI Budget Optimization — insight → recommendation → approve → dữ liệu thật đổi**:
   - Tạo dữ liệu test qua script Prisma một lần (không qua UI, vì `createLead()` hiện
     chưa có field gán `campaignId` — đúng tiền lệ `seed-lead-won` trong
     `prisma/seed.ts`): campaign "Demo Budget Optimization — Hiệu quả cao" (ACTIVE,
     ngân sách 3.000.000đ) + 3 lead gắn `campaignId` → cost/lead = 1.000.000đ, so với
     `seed-campaign-1` ("Ra mắt sản phẩm Q4", ACTIVE, ngân sách 50.000.000đ, 1 lead) →
     cost/lead = 50.000.000đ (chênh lệch 50x ≫ ngưỡng 1.5x).
   - Bấm "Tạo insight mới" ở `/ai/insights` → xuất hiện đúng 1 insight
     `BUDGET_OPTIMIZATION` (Trung bình) với evidence thật khớp số liệu trên: "tốn
     ~50.000.000đ/lead ... chỉ ~1.000.000đ/lead ... Đề xuất giảm 20% (10.000.000đ)".
   - Sang `/ai/recommendations` → thấy đề xuất "Giảm ngân sách chiến dịch 'Ra mắt sản
     phẩm Q4' xuống 40.000.000đ" (Chờ duyệt) → bấm "Duyệt & thực thi" → trạng thái
     "Đã thực thi", kết quả "Thành công", log 2 dòng đầy đủ.
   - Mở lại `/marketing/campaigns/seed-campaign-1` → bấm Sửa → xác nhận field "Ngân
     sách (VNĐ)" **thật sự là `40000000`** (giảm từ 50.000.000) — chứng minh
     `ADJUST_BUDGET` không phải hiệu ứng UI giả, `Campaign.budget` thật đã đổi trong
     DB qua `updateCampaign()`.
3. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (53 route,
   không route mới ở Phase 9 — chỉ mở rộng logic của route đã có).

## Việc còn lại / giới hạn đã biết

1. Budget Optimization mới tối ưu ngân sách theo cost/lead ước lượng — khi Phase 6 có
   `AdMetricDaily` thật (cần OAuth Ads), nên đổi `costPerLead` sang Spend thật để
   chính xác hơn (xem quyết định kỹ thuật #4).
2. `createLead()` (`services/crm/leads.ts`) chưa có field gán `campaignId` khi tạo —
   hiện chỉ gán được qua DB trực tiếp (seed hoặc script). Nếu cần UI thật để gán lead
   vào campaign lúc tạo, đây là việc của CRM (ngoài phạm vi Phase 9 — Optimization),
   không phải giới hạn của Automation Engine hay AI.
3. `AUTOMATION_EVENT_TYPES` hiện có 5 loại event (task/lead×2/order/campaign) — domain
   nào ghi `writeEvent()` mới trong tương lai chỉ cần thêm 1 dòng vào danh sách này,
   không cần sửa `services/process/automation.ts`.
