# Phase 10 — Scale

Trạng thái: **Hoàn thành, đã verify với dữ liệu/luồng thật** — đây là phase cuối
trong roadmap 10 phase. Không có phần nào bị chặn credential (khác Ads Phase 6 /
Claude API Phase 8) — mọi hạng mục dưới đây hoạt động đầy đủ ngay bây giờ.

## Phạm vi đã làm

1. **Performance — sửa N+1 thật + đo benchmark thật.**
2. **Caching**: (xem "Quyết định không làm" bên dưới — lý do không thêm `use cache`).
3. **Mobile/PWA**: Web App Manifest + Service Worker viết tay (offline app-shell) +
   gợi ý cài đặt.
4. **Observability**: structured logger + bảng `ErrorLog` thật + trang
   `/admin/observability`, không phụ thuộc Sentry hay dịch vụ ngoài nào.
5. **Advanced scoped permissions**: `RolePermission.scope` (ALL/DEPARTMENT/OWN) áp
   dụng thật cho `tasks.read` và `leads.read`.

## 1. Performance

### N+1 đã sửa (không phải lý thuyết — đo bằng query thật)

- **`services/marketing/campaigns.ts#listCampaigns()`** — trước đây gọi
  `computeKpis()` per-campaign bên trong `Promise.all` (1 query lead + 1 query order
  cho MỖI campaign). Viết lại thành `computeKpisForCampaigns()`: lấy TOÀN BỘ lead của
  org theo `campaignId` trong 1 query, TOÀN BỘ order liên quan trong 1 query, group
  lại trong bộ nhớ — luôn đúng 2 query bất kể N campaign.
  - **Benchmark thật** (script tạm dùng `$transaction` rồi rollback, không để lại dữ
    liệu rác — N=20 campaign test): **20 query → 1 query (giảm 95%)**, thời gian
    **28.3ms → 8.0ms (giảm 72%)**.
- **`services/analytics/data-quality.ts#runDataQualityScan()`** — 2 detector có N+1:
  - MISSING_UTM: trước đây 1 `count()` riêng cho từng landing page đã publish → gộp
    thành 1 `groupBy(landingPageId)`.
  - DUPLICATE_EVENT: trước đây 1 `findMany()` riêng cho từng form → gộp thành 1
    `findMany` lấy toàn bộ submission của mọi form trong org, group theo
    `landingFormId` trong bộ nhớ.
  - Thêm index `@@index([organizationId, landingPageId])` cho `AttributionTouchpoint`
    (backing index cho groupBy mới — trước đây không có index nào phù hợp truy vấn
    này).

### Đã khảo sát, quyết định KHÔNG sửa (ghi rõ lý do, tránh "sửa cho có")

- `services/process/workflow-engine.ts` (2 write/node) và
  `services/ads/sync.ts` (1 upsert/account-campaign-metric): số query tỉ lệ thuận với
  khối lượng công việc thật cần ghi (mỗi node cần 1 record chạy, mỗi ngày metric cần 1
  row) — không phải N+1 do thiếu batch, mà là khối lượng ghi cần thiết. Gộp lại sẽ
  phức tạp hoá code đổi lấy lợi ích nhỏ (workflow demo có ~5 node, sync test có vài
  chục dòng).
- `services/tasks/tasks.ts#moveTaskStatus()` (Kanban drag): mỗi lần kéo-thả update lại
  `position` của cả cột — số UPDATE tỉ lệ với số task trong cột đang kéo (~20-30 ở dữ
  liệu seed), đã nằm trong 1 `$transaction`, không phải N+1 giữa nhiều request.

## 2. Caching — quyết định KHÔNG làm ngay, ghi rõ lý do

Next.js 16 thay `unstable_cache` (deprecated) bằng `"use cache"` + Cache Components
(`node_modules/next/dist/docs/.../use-cache.md`) — nhưng bật `cacheComponents: true`
là **flag toàn app**, bắt buộc audit lại MỌI route dùng API động (`cookies()` qua
`auth()`/`requireSession()` — dùng ở gần như mọi trang `(protected)`) để thêm
Suspense/tách cached-scope đúng cách, nếu không sẽ lỗi build/runtime hàng loạt. Với
quy mô 56 route hiện tại, đây là 1 cuộc migrate riêng, rủi ro cao nếu làm vội ở cuối
Phase 10 — quyết định **không bật** để tránh phá vỡ toàn bộ app đã hoạt động đúng.
`unstable_cache` (API cũ) vẫn dùng được nhưng đã deprecated nên không thêm dependency
mới vào 1 API sắp thay thế. Việc N+1 fix ở mục 1 đã mang lại phần lớn lợi ích hiệu
năng thực tế (giảm số query, không phải giảm độ trễ mạng của cùng 1 query lặp lại).

## 3. Mobile/PWA

- `app/manifest.ts` (Next.js file convention thật, KHÔNG dùng `next-pwa`/thư viện
  ngoài) — serve tại `/manifest.webmanifest` (đã verify bằng `next build` + fetch
  thật).
- `public/icon.svg` — icon thật (chưa có bộ icon PNG thiết kế riêng, xem "Việc còn
  lại").
- `public/sw.js` — Service Worker viết tay: cache-first cho static asset Next.js
  (`/_next/static/*`, bất biến theo build), network-first cho điều hướng trang với
  fallback `/offline` khi mất mạng. KHÔNG cache API/RSC payload (dữ liệu RBAC/dashboard
  đổi liên tục — serve nhầm cache cũ nguy hiểm hơn không có gì).
- `app/offline/page.tsx` — trang fallback thật, thêm vào `OPEN_PATHS` của
  `proxy.ts` để precache lần đầu không bị chặn bởi auth.
- `components/pwa/{sw-register,install-prompt}.tsx` — đăng ký SW thật +
  gợi ý cài đặt theo đúng khuyến nghị chính thức của Next.js (không tự bắt
  `beforeinstallprompt` vì không cross-browser/không hoạt động trên Safari iOS).

**Verify thật (browser)**: `fetch('/manifest.webmanifest')` → 200, đúng tên/icon;
`navigator.serviceWorker.getRegistration()` → đã đăng ký, `state: "activated"`;
`caches.open('vimove-os-shell-v1')` → chứa đúng `/offline`, `/icon.svg`,
`/manifest.webmanifest` + toàn bộ static chunk đã precache; UI gợi ý cài đặt hiện
đúng trên desktop lẫn khi giả lập iOS.

## 4. Observability

- `lib/observability/logger.ts` — `logger.{info,warn,error}()` in JSON 1 dòng/log ra
  stdout (Vercel/self-host thu log qua đây ngay, không cần cấu hình thêm) +
  `logError()` ghi thật vào bảng `ErrorLog` mới.
- `lib/observability/report-client-error.ts` — Server Action cầu nối để error boundary
  phía Client Component (`app/(protected)/error.tsx`, `app/global-error.tsx`, cả 2 bắt
  buộc `"use client"`) ghi được lỗi vào DB.
- `services/core/observability.ts` + `/admin/observability` — trang xem `ErrorLog`
  thật, permission mới `observability.read` (seed cho SUPER_ADMIN/ADMIN/DIRECTOR/
  ANALYST/MANAGER — nhóm vai trò giám sát, cùng nhóm với `audit_logs.read`).
- `services/process/automation.ts` — lỗi trigger workflow tự động (trước đây nuốt lỗi
  hoàn toàn, không để lại dấu vết gì) nay ghi qua `logger.warn()`.

**Verify thật**: ghi 1 `ErrorLog` thử nghiệm trực tiếp qua Prisma (bỏ qua wrapper
`server-only` không chạy được ngoài Next.js runtime, nhưng đúng schema/field mà
`logError()` ghi) → mở `/admin/observability` → thấy đúng KPI "1 lỗi/1 lỗi 24h" + dòng
lỗi với message/path/thời gian đúng, bấm mở rộng → thấy đúng stack trace → xoá dữ liệu
test.

## 5. Advanced scoped permissions

- Schema: `enum PermissionScope { ALL DEPARTMENT OWN }`,
  `RolePermission.scope PermissionScope @default(ALL)`.
- `lib/permissions/catalog.ts#SCOPABLE_PERMISSIONS` — danh sách đóng các permission có
  ý nghĩa lọc theo người sở hữu: **`tasks.read`**, **`leads.read`** (2 resource có khái
  niệm assignee/owner rõ ràng — không áp cho permission quản trị như `roles.manage`).
- `lib/permissions/role-defaults.ts#DEFAULT_PERMISSION_SCOPES` — role cá nhân
  (STAFF/MARKETING_STAFF/SALES/CONTENT) mặc định **OWN**, role Trưởng phòng
  (MANAGER/MARKETING_MANAGER/SALES_MANAGER) mặc định **DEPARTMENT**, role giám sát
  toàn tổ chức (SUPER_ADMIN/ADMIN/DIRECTOR/ANALYST/VIEWER) giữ **ALL**.
- `lib/auth/rbac.ts#getPermissionScope()`/`buildVisibilityScope()` — đọc scope thật
  của user (rộng nhất trong các role họ có) từ session; `auth.ts` tính
  `permissionScopes` + `departmentId` vào JWT/session (giống cơ chế `permissions` sẵn
  có — **chỉ refresh khi đăng nhập lại**, đúng hành vi đã lặp lại từ Phase 4).
- Áp dụng thật vào `services/tasks/tasks.ts` (`listAllTasks`/`listSchedulableTasks`/
  `listGanttTasks`/`getKanbanBoard`) và `services/crm/leads.ts#listLeadsBoard` — 6
  trang UI (Tất cả công việc/Kanban/Lịch/Timeline/Gantt/Lead) đọc `visibility` từ
  session rồi truyền vào service, hiện đúng mô tả phạm vi ("Công việc được giao cho
  bạn" / "của phòng ban bạn" / mặc định toàn tổ chức) thay vì luôn ngầm định "toàn tổ
  chức" như trước Phase 10.
- UI cấu hình: `/admin/roles` → Sửa quyền → mỗi permission trong
  `SCOPABLE_PERMISSIONS` có thêm dropdown chọn scope (đánh dấu `*`), lưu qua
  `updateRolePermissions()` đã sửa để nhận `{permissionId, scope}[]` thay vì chỉ
  `permissionId[]`.

**Verify thật (browser, đổi role thật)**: đăng nhập `sales@vimove.vn` (role SALES,
scope OWN mặc định) → `/work/tasks` chỉ hiện đúng **2/7+ task** (task được giao cho
đúng user này) với mô tả "Công việc được giao cho bạn" → `/crm/leads` chỉ hiện đúng
**3 lead** user này sở hữu (loại đúng lead của campaign test do marketing sở hữu) với
mô tả "Lead của bạn". Mở `/admin/roles` → Sửa quyền → Nhân viên (STAFF) → xác nhận
`tasks.read *` hiện đúng dropdown "Chỉ của chính user" (khớp seed default).

## Việc còn lại / giới hạn đã biết

1. ~~Icon PWA mới có SVG, chưa có bộ PNG 192×192/512×512 thiết kế riêng~~ — **đã xử lý
   sau đó**: `public/icon-192.png`/`icon-512.png` giờ cắt từ logo chính thức VIMOVE
   (`public/Vimove.png`), dùng cho manifest + `app/icon.png`/`app/apple-icon.png`/
   `app/favicon.ico` — xem NHAT-KY-KIEN-TRUC.md.
2. **Push Notification chưa làm** — cần VAPID keys (credential-gated, cùng nhóm với
   Ads OAuth/Claude API), không nằm trong "PWA cài được trên mobile" (nghiệm thu
   roadmap không yêu cầu push).
3. **`"use cache"`/Cache Components chưa bật** — quyết định có chủ đích, xem mục 2.
4. **Job queue/worker thật (BullMQ/Redis...) chưa thêm** — vì hiện chưa có job nào đủ
   nặng cần tách khỏi request-response (chỉ `services/ads/sync.ts`, chưa verify được
   sandbox thật do thiếu credential Ads — tách queue cho 1 job chưa chạy thật là sớm).
   Khi Ads Phase 6 có credential thật và cần sync định kỳ, đây là điểm nối queue hợp
   lý nhất.
5. Scope `DEPARTMENT` cho Gantt: task phụ thuộc (`dependsOn`) 1 task NGOÀI phạm vi
   scope hiện tại sẽ không hiện trên UI (mũi tên phụ thuộc), nhưng validate server-side
   ở `rescheduleTask()` vẫn đọc thẳng DB (không qua scope) nên việc chặn vi phạm phụ
   thuộc vẫn đúng — chỉ UI không vẽ được mũi tên tới task ngoài phạm vi nhìn thấy.

## Kiểm tra đã thực hiện

`npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch (56 route, +3 so
với Phase 9: `/admin/observability`, `/manifest.webmanifest`, `/offline`). Toàn bộ mục
1-5 đã verify trực tiếp trong Browser preview với dữ liệu/session thật như mô tả ở
từng mục, không có phần nào "code xong nhưng chưa chạy thử".
