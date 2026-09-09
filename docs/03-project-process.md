# Phase 3 — Project & Process

Trạng thái: **hoàn thành và đã verify trong Browser preview với dữ liệu seed thật**
(migration đã apply lên Postgres sống qua Docker, không còn ở trạng thái "chưa migrate"
như ghi chú môi trường của Phase 2).

## Phạm vi đã làm

- Bảng: `Project`, `ProjectMember`, `ProjectMilestone`, `ProjectFile`, `ProjectTemplate`,
  `Workflow`, `WorkflowVersion`, `WorkflowRun`, `WorkflowRunStep`, `ApprovalRequest`,
  `ApprovalStep`; thêm cột `projectId` vào `Task` (nay `Task` có thể gắn với 1 dự án).
- Trang: Dự án (`/projects`, `/projects/[projectId]` — tab Milestone/Thành viên/Công
  việc/File), Approval Hub (`/work/approvals` — tab Chờ tôi duyệt/Yêu cầu của tôi/Tất
  cả), Workflow Builder (`/process/workflows`, `/process/workflows/[workflowId]` — canvas
  kéo-thả React Flow), Run log (`/process/runs/[runId]`).
- Task Detail: thêm liên kết "Dự án" và nút "Yêu cầu duyệt" (tạo `ApprovalRequest` gắn
  với task ngay từ trang task, không phải chỉ tạo được từ Approval Hub).
- Permission mới: `projects.read/create/update/delete`, `workflows.read/manage`,
  `approvals.read/manage` (thêm vào `lib/permissions/catalog.ts`, wire
  `DEFAULT_ROLE_PERMISSIONS`).

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Workflow Engine là thật, không phải khung sườn.** `services/process/workflow-engine.ts`
   thực sự chạy từng node theo `WorkflowDefinition` (JSON `nodes`/`edges` lưu trong
   `WorkflowVersion`), ghi `WorkflowRunStep` cho mỗi bước với input/output thật:
   - `TRIGGER`: no-op, chỉ ghi nhận `triggeredBy`.
   - `ACTION`: gọi thật `createNotification()` (services/core/notifications.ts) hoặc ghi
     `AuditLog` tuỳ config — verify được bằng chuông thông báo tăng số thật sau khi chạy.
   - `CONDITION`: eval một dot-path đơn giản trên `triggerPayload` (`a.b.c`), rẽ nhánh
     true/false bằng 2 Handle riêng trên canvas.
   - `WEBHOOK`: `fetch()` thật có timeout + retry, không giả lập.
   - `PARALLEL`: pass-through (chạy tất cả nhánh con), không có join phức tạp.
   - `APPROVAL`: tạo `ApprovalRequest` thật và **tạm dừng run** (status
     `AWAITING_APPROVAL`); `resumeAfterApproval()` được gọi khi bước duyệt cuối cùng có
     quyết định, để chạy tiếp phần còn lại của workflow.
2. **Giới hạn được ghi nhận thẳng thắn, không giả vờ hoàn chỉnh:**
   - `DELAY`: mô phỏng (đánh dấu hoàn thành ngay, không có hàng đợi bền/cron thật) — cần
     một job queue (vd. BullMQ/Vercel Cron) ở phase sau nếu cần delay thật nhiều giờ/ngày.
   - `AI`: luôn trả về `SKIPPED` với lý do "chưa có `ANTHROPIC_API_KEY`" — nối thật ở
     Phase 8 (AI Command Center), không tạo nút giả vờ chạy AI.
3. **Approval — sequential vs parallel, tính lượt ai được duyệt ở server.**
   `isStepActionable()` trong `services/process/approvals.ts` là nguồn sự thật duy nhất:
   - `SEQUENTIAL`: chỉ bước có `position` nhỏ nhất còn `PENDING` mới actionable; các bước
     sau bị khoá cho tới khi bước trước có quyết định — verify bằng browser: seed
     `seed-approval-1` có 2 bước, sau khi Admin (bước #1) bấm Duyệt, bước #2 (Lê Thị
     Marketing) mới được actionable, request tổng thể vẫn `PENDING` cho tới khi đủ.
   - `PARALLEL`: mọi bước `PENDING` đều actionable cùng lúc; request `APPROVED` khi tất cả
     duyệt, `REJECTED` ngay khi 1 người từ chối.
   - **Escalate quá hạn = on-read, không cron.** `escalateOverdueSteps()` chạy mỗi khi tải
     Approval Hub, tự đánh dấu `escalatedAt` cho các bước quá `dueAt` và bắn thông báo cho
     cả người duyệt lẫn người yêu cầu. Đây là giải pháp MVP vì data model hiện chưa có khái
     niệm "quản lý trực tiếp" để escalate lên — ghi nhận rõ để không hiểu nhầm là bug.
4. **Task ↔ Project là optional, không bắt buộc.** `Task.projectId` nullable — task độc
   lập (không thuộc dự án nào) vẫn hoạt động bình thường như Phase 2, đúng tinh thần
   "không phá vỡ phase trước".
5. **Project Member vs Task Assignee là 2 khái niệm khác nhau.** `ProjectMember` (role
   OWNER/MEMBER/VIEWER) chỉ kiểm soát ai *thuộc* dự án để hiển thị ở tab Thành viên;
   không tự động giới hạn ai được gán làm assignee của Task trong dự án đó (giữ đơn giản,
   đúng phạm vi roadmap Phase 3).
6. **React Flow canvas dùng `useRef` counter cho id node, không dùng `Date.now()`/
   `crypto.randomUUID()`** trong `components/process/workflow-canvas.tsx` — tránh vi phạm
   React Compiler purity rule (`react-hooks/purity`) dù hàm chỉ được gọi từ onClick.
7. **Lưu version workflow**: `saveDraft()` sửa tại chỗ nếu version hiện tại chưa publish;
   nếu đã publish thì tạo `WorkflowVersion` mới (giữ lịch sử, không mất bản đã chạy production).

## Kiểm tra đã thực hiện (browser, dữ liệu seed thật)

1. Dashboard: KPI "Chờ bạn phê duyệt" đổi từ số giả (Phase 1) sang số thật từ
   `approvalStep.count()`.
2. `/projects/seed-project-1`: hiển thị đúng 3 milestone (1 đã hoàn thành), 3 thành viên,
   2 công việc liên kết đúng title/priority/assignee.
3. `/process/workflows/[id]`: canvas render đúng Trigger→Action; bấm "Chạy thử" → tạo
   `WorkflowRun` mới, cả 2 step `Thành công`, chuông thông báo tăng thật (do node ACTION
   gọi `createNotification` thật) — xem Run log chi tiết có payload JSON thật.
4. `/work/approvals`: seed 2-bước tuần tự — Admin duyệt bước #1 → tab "Chờ tôi duyệt"
   về 0 đúng như kỳ vọng (chưa tới lượt), tab "Tất cả" xác nhận bước #1 "Đã duyệt", bước
   #2 vẫn "Đang chờ", request tổng thể vẫn "Đang chờ".
5. Task Detail (`/work/tasks/seed-task-1`): liên kết "Dự án" điều hướng đúng sang trang
   dự án; nút "Yêu cầu duyệt" mở dialog chọn người duyệt/chế độ/SLA, gửi thành công tạo
   `ApprovalRequest` mới xuất hiện ngay trong Approval Hub.
6. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch, 0 lỗi/cảnh báo.

## Ghi chú môi trường

Docker + WSL2 đã cài đặt thành công trong sandbox này (trước đó Phase 2 phải sinh
migration offline vì chưa có Docker). Từ Phase 3 trở đi, `docker compose up -d` chạy
Postgres thật trên cổng 5437, `prisma migrate deploy` áp dụng migration trực tiếp, không
còn cần kỹ thuật diff offline nữa (dù kỹ thuật đó vẫn hữu ích để sinh SQL migration mà
không cần shadow DB).
