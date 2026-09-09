# Phase 2 — Work Hub

Trạng thái: **hoàn thành** (code xong, migration chưa apply lên DB thật trong môi
trường phát triển này — xem "Ghi chú môi trường" cuối file).

## Phạm vi đã làm

- Bảng: `Task`, `TaskChecklistItem`, `TaskComment`, `TaskAttachment`, `TaskDependency`,
  `TaskWatcher`, `TaskActivity`, `TaskTimeLog`, `Tag`/`TaskTag`, `TaskTemplate`.
- Trang: Việc của tôi (`/work/my-tasks`), Tất cả công việc (`/work/tasks`), Task Detail
  (`/work/tasks/[taskId]`), Kanban (`/work/kanban`), Lịch (`/work/calendar`), Timeline
  (`/work/timeline`), Gantt (`/work/gantt`), Khối lượng công việc (`/work/workload`),
  Mẫu công việc (`/work/templates`).
- Permission mới: `tasks.read/create/update/delete`, `task_templates.manage` (thêm vào
  `lib/permissions/catalog.ts`, wire `DEFAULT_ROLE_PERMISSIONS`).

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Kanban = cột cố định theo `TaskStatus`** (`TODO, IN_PROGRESS, IN_REVIEW, DONE,
   CANCELLED`) — không có board tuỳ biến, đúng phạm vi roadmap.
2. **Dependency = finish-to-start duy nhất.** `dependsOnTask` phải có `dueAt` trước khi
   task hiện tại được phép có `startAt` sớm hơn ngày đó; ngược lại, không được dời
   `dueAt` trễ hơn `startAt` của task đang phụ thuộc vào nó. Chặn 2 lớp:
   - Client (Gantt): kéo bị clamp về mốc sớm nhất được phép (`components/work/gantt-view.tsx`).
   - Server (bắt buộc, không tin client): `rescheduleTask(..., { enforceDependencies: true })`
     trong `services/tasks/tasks.ts` re-validate và throw nếu vi phạm.
   - Cycle (A phụ thuộc B, B phụ thuộc A...) bị chặn bằng DFS trong
     `services/tasks/dependencies.ts` (`wouldCreateCycle`).
3. **Attachment = link ngoài (Phase 2), chưa nối Vercel Blob.** `BLOB_READ_WRITE_TOKEN`
   chưa cấu hình trong `.env` — giống cách Google OAuth login ở Phase 1 bị ẩn tới khi có
   credential thật. Người dùng dán tên + URL (Drive/Sheets/...); upload file nhị phân là
   việc tiếp theo khi có Blob token, không phải nút giả — form thêm link hoạt động thật
   100% ngay bây giờ.
4. **Workload — công thức và ngưỡng** (`lib/work/workload.ts`):
   - Năng suất chuẩn: **40 giờ/tuần/người** (`WEEKLY_CAPACITY_HOURS`).
   - `% = tổng estimateHours của các task đang mở (không DONE/CANCELLED) có khoảng
     [startAt, dueAt] giao với tuần đang xem, chia cho 40, làm tròn`.
   - Ngưỡng: `<80%` ổn định, `80–100%` cần chú ý, `>100%` quá tải
     (`WORKLOAD_WARN_THRESHOLD` / `WORKLOAD_OVER_THRESHOLD`).
   - Rollup theo team = trung bình % của các thành viên **có việc trong tuần** (member
     rảnh việc không kéo trung bình xuống).
   - Task không có cả `startAt` lẫn `dueAt` không được tính vào Workload (không thể xác
     định thuộc tuần nào) — vẫn hiển thị bình thường ở My Tasks/All Tasks/Kanban.
5. **Chưa có `projectId` trên `Task`.** Bảng `projects` chưa tồn tại tới Phase 3; sẽ
   `ALTER` thêm cột + FK khi Phase 3 build xong, không pre-build trước.
6. **`work/approvals/`** (có trong sketch thư mục ở tài liệu gốc) **không** được thêm ở
   Phase 2 — đó là Approval Hub, thuộc Phase 3. Không tạo route/nav trỏ tới trang chưa
   tồn tại (đúng §34 rule 6).
7. **Timeline vs Gantt**: hai view dùng chung base lưới ngày
   (`components/work/date-grid.tsx`) nhưng khác nhau ở ràng buộc — Timeline kéo tự do
   (không có dependency), Gantt kéo bị giới hạn + vẽ mũi tên phụ thuộc bằng SVG. Cả hai
   tự dựng bằng CSS grid + `date-fns`, không thêm thư viện Gantt/Calendar ngoài (tránh
   rủi ro tương thích React 19/Next 16 chưa kiểm chứng) — thư viện mới duy nhất là
   `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` cho kéo-thả.
8. **RBAC trong Work Hub gộp phẳng** giống mức độ chi tiết của Phase 1: mọi hành động
   sửa task/checklist/comment/attachment/dependency/watcher/time-log đều nằm dưới một
   permission `tasks.update` — không tách permission theo từng sub-resource.

## Kiểm tra dependency-block thủ công

1. Mở `/work/gantt`, tìm 2 task mẫu có phụ thuộc ("Triển khai landing page chiến dịch"
   phụ thuộc "Lên kế hoạch chiến dịch Marketing Q4").
2. Kéo thanh "Triển khai landing page..." sang trái, cố đặt ngày bắt đầu trước ngày kết
   thúc của task nó phụ thuộc → bị kéo về đúng ngày sớm nhất được phép (toast thông báo),
   không lưu được ngày vi phạm.
3. Server luôn re-check độc lập — test bằng cách gọi thẳng Server Action với ngày vi
   phạm (bỏ qua UI) vẫn bị `rescheduleTask` throw lỗi.

## Ghi chú môi trường (phiên làm việc này)

Máy chạy agent hiện tại **không có Docker** để `docker compose up -d` Postgres cục bộ,
nên không thể chạy `npx prisma migrate dev` thật với DB sống. Migration SQL trong
`prisma/migrations/20260908130000_work_hub_tasks/` được sinh **offline bằng chính engine
Prisma** (`prisma migrate diff --from-schema <schema cũ> --to-schema <schema mới>
--script`), không phải viết tay — nội dung tương đương 100% với những gì `migrate dev`
sẽ tạo ra. `prisma generate` đã chạy được (không cần DB) nên toàn bộ code đã typecheck
sạch với đúng type Prisma Client thật. Việc còn lại trước khi dùng thật:

```bash
docker compose up -d
npx prisma migrate deploy
npx prisma db seed
```
