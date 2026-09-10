# VIMOVE OS

Business Operating System hợp nhất: Work Hub + Process Hub + Marketing Hub + CRM/Sales + Analytics +
AI Command Center. Xem [docs/00-phuong-an-trien-khai.md](docs/00-phuong-an-trien-khai.md) để biết
phương án triển khai đầy đủ (10 phase) và các quyết định nền tảng đã chốt.

Hệ thống nội bộ hiện có [VimoveCRM](../VimoveCRM) (đang chạy production) được coi là **Legacy
VIMOVE** — không đụng vào, VIMOVE OS build mới hoàn toàn và chỉ nối qua Legacy Adapter khi cần di
trú dữ liệu cụ thể (xem docs).

> 📓 Đang tiếp tục dự án từ máy khác, hoặc cần thông tin hạ tầng/deploy production
> (Vercel, Neon, biến môi trường, tài khoản...)? Đọc
> [NHAT-KY-KIEN-TRUC.md](NHAT-KY-KIEN-TRUC.md) trước — đó là nguồn thông tin vận hành
> đầy đủ nhất, luôn được cập nhật kèm số version ở cuối file.

## Trạng thái hiện tại

**Phase 1 — Foundation: hoàn thành.** Đăng nhập, RBAC server-side, quản trị Người dùng/Phòng
ban/Nhóm/Vai trò/Quyền hạn, nhật ký Audit append-only, Dashboard shell với KPI thật.

**Phase 2 — Work Hub: hoàn thành.** Task CRUD đầy đủ (checklist/bình luận/đính kèm dạng
link/phụ thuộc/theo dõi/log thời gian/nhãn/mẫu), My Tasks, All Tasks, Task Detail, Kanban
(kéo-thả lưu DB thật), Calendar/Timeline/Gantt (kéo dời lịch, Gantt chặn vi phạm phụ thuộc
2 lớp client+server), Khối lượng công việc theo user/team. Xem
[docs/02-work-hub.md](docs/02-work-hub.md) để biết quyết định kỹ thuật chi tiết.

**Phase 3 — Project & Process: hoàn thành, đã verify với dữ liệu thật.** Dự án (milestone/
thành viên/công việc/file), Workflow Builder (canvas kéo-thả React Flow, engine chạy thật
Trigger/Action/Condition/Webhook/Parallel/Approval, Run log chi tiết từng bước), Approval
Hub (duyệt tuần tự/song song, escalate quá hạn). Xem
[docs/03-project-process.md](docs/03-project-process.md) để biết quyết định kỹ thuật và
các giới hạn đã ghi nhận rõ (Delay mô phỏng, node AI chờ Phase 8).

**Phase 4 — CRM & Sales: hoàn thành, đã verify với dữ liệu thật.** Lead (pipeline board
kéo-thả, timeline hoạt động, convert thành khách hàng), Khách hàng (Customer 360 — LTV/
đơn hàng/lead), Đơn hàng (liên kết khách hàng/sản phẩm/kênh bán, snapshot giá tại thời
điểm đặt), Sản phẩm, Kênh bán, quản lý Pipeline/Giai đoạn. Interface
`LegacyVimoveAdapter` (chỉ interface + stub, chưa nối thật). Xem
[docs/04-crm-sales.md](docs/04-crm-sales.md) để biết quyết định kỹ thuật và các lỗi đã
phát hiện + sửa trong lúc verify (breadcrumb dẫn tới trang không tồn tại, Select hiện
raw value khi nghỉ, Decimal không serialize qua Server Action).

**Phase 5 — Marketing: hoàn thành, đã verify với dữ liệu thật (kể cả 1 luồng công
khai thật).** Chiến dịch (KPI Spend/Revenue/ROAS/Leads/CPL/Orders/CAC/Profit tính
trên dữ liệu thật), Content Hub (board kéo-thả 8 giai đoạn), Social (tài khoản/bài
đăng — đăng thủ công), Landing Page (trang công khai thật tại `/lp/[slug]` với form
thu lead hoạt động, không cần đăng nhập), Email Campaign (chưa nối provider thật).
Xem [docs/05-marketing.md](docs/05-marketing.md) để biết quyết định kỹ thuật và lỗi
middleware đã phát hiện + sửa (chặn nhầm trang công khai khi đã đăng nhập).

**Phase 6 — Ads Integration: code xong, chưa verify sandbox thật** (đã thông báo
trước — chưa có app credential Meta/Google Ads/TikTok/Zalo). Interface
`AdsIntegrationProvider` + 4 provider stub, mã hoá token AES-256-GCM (đã verify độc
lập bằng round-trip thật), trang `/integrations/ads` hiện đúng trạng thái "Chưa kết
nối" với nút Kết nối bị disabled thật (không giả vờ). Xem
[docs/06-ads-integration.md](docs/06-ads-integration.md) để biết việc còn lại trước
khi dùng thật.

**Phase 7 — Analytics: hoàn thành, đã verify với dữ liệu thật (kể cả 1 luồng
attribution thật đầu-cuối).** Dashboard 6 tab Executive/Work/Marketing/Ads/Sales/
Content, Attribution (touchpoint UTM thật từ `/lp/[slug]`, first-touch/last-touch,
idempotency key), Report Builder (Dataset→Dimension→Metric→Visualization, xuất CSV
thật), Data Quality Hub (5 detector thật — tự phát hiện chiến dịch seed thiếu dữ liệu
spend thật). Xem [docs/07-analytics.md](docs/07-analytics.md) để biết quyết định kỹ
thuật và bug dialog-overflow đã phát hiện + sửa trên 9 dialog trong lúc verify.

**Phase 8 — AI Command Center: AI Work Assistant chưa verify API Claude thật (chưa
có `ANTHROPIC_API_KEY`), nhưng luồng Insight→Recommendation→Approval→Action→Result→
Audit Log đã verify đầy đủ với 1 hành động thật (tạm dừng chiến dịch).** AI Insights
(3 heuristic thật: điểm nghẽn công việc, sức khoẻ dự án, bất thường marketing),
Approval Queue (duyệt đề xuất → thực thi thật qua service layer đã có → ghi log đầy
đủ — đã verify Campaign thật sự đổi trạng thái PAUSED sau khi duyệt), AI Work
Assistant (context lọc theo đúng RBAC của người hỏi). Xem
[docs/08-ai-command-center.md](docs/08-ai-command-center.md) để biết quyết định kỹ
thuật và việc còn lại trước khi dùng thật.

**Phase 9 — Optimization: hoàn thành, đã verify đầy đủ với dữ liệu thật (không phụ
thuộc credential còn thiếu).** Automation Engine (mở rộng Workflow Engine Phase 3 —
workflow tự động trigger từ event nghiệp vụ thật `task.created`/`lead.created`/
`lead.won`/`order.created`/`campaign.created`, idempotent qua `Event.idempotencyKey`,
đã verify tạo task → workflow tự chạy → notification thật xuất hiện, không bấm "Chạy
thử"), AI Budget Optimization (heuristic thứ 4 so sánh cost/lead giữa các chiến dịch,
đề xuất `ADJUST_BUDGET` qua Approval Queue đã có từ Phase 8 — đã verify duyệt xong
`Campaign.budget` thật sự đổi trong DB). Xem
[docs/09-optimization.md](docs/09-optimization.md) để biết quyết định kỹ thuật và
giới hạn đã ghi nhận (tối ưu theo ngân sách dự kiến, chưa có Spend thật chờ Phase 6).

**Phase 10 — Scale: hoàn thành, đã verify với dữ liệu/session thật — phase cuối cùng
trong roadmap 10 phase.** Sửa N+1 thật (KPI chiến dịch: 20 query → 1 query, đo bằng
benchmark thật), PWA (manifest + Service Worker offline app-shell viết tay, gợi ý cài
đặt), Observability (bảng `ErrorLog` thật + `/admin/observability`, không phụ thuộc
Sentry), Advanced scoped permissions (`RolePermission.scope` ALL/DEPARTMENT/OWN áp
dụng thật cho `tasks.read`/`leads.read` — đã verify đăng nhập vai trò Nhân viên Kinh
doanh chỉ thấy đúng việc/lead của mình). Xem [docs/10-scale.md](docs/10-scale.md) để
biết quyết định kỹ thuật (kể cả lý do CHƯA bật `"use cache"`/Cache Components) và giới
hạn đã ghi nhận.

**Phase 11 — Chấm công (Attendance & Timekeeping): hoàn thành, đã verify đầy đủ với
dữ liệu/luồng thật.** Không nằm trong roadmap 10 phase gốc — thêm theo yêu cầu người
dùng, tham chiếu MISA AMIS Chấm Công. Chấm công thủ công/GPS (Haversine tính khoảng
cách thật, đã verify từ chối đúng khi ở xa văn phòng)/QR động (token thật đổi mỗi
20s, verify trực tiếp trong DB) — Wifi nội bộ/FaceID/máy vân tay hiện rõ "chưa hỗ
trợ" thay vì giả lập vì không khả thi trên web app thuần. Bảng công tự tổng hợp thật
từ dữ liệu chấm công + ca + nghỉ phép. Đơn nghỉ phép tái dùng nguyên Approval Engine
đã có từ Phase 3 (đã verify tạo đơn → hiện trong Approval Hub → duyệt → trạng thái
đổi thật). Xem [docs/11-attendance.md](docs/11-attendance.md) để biết quyết định
phạm vi (hình thức nào làm thật được, hình thức nào không) và giới hạn đã ghi nhận.

## Chạy local

```bash
# 1. Postgres (Docker, port 5437 — tách biệt hoàn toàn với VimoveCRM)
docker compose up -d

# 2. Cài dependencies + migrate + seed
npm install
npx prisma migrate deploy
npx prisma db seed

# 3. Chạy dev server
npm run dev   # http://localhost:3000
```

Đăng nhập: `admin@vimove.vn` / `ChangeMe123!` (đổi ngay sau lần đầu qua trang Hồ sơ cá nhân).
Seed Phase 2 còn tạo thêm `marketing@vimove.vn` và `sales@vimove.vn` (cùng mật khẩu) để demo
Kanban/Gantt/Workload có nhiều người phụ trách.

### Bật đăng nhập Google Workspace (tuỳ chọn)

Code đã sẵn sàng (`Google` provider trong `auth.ts`) nhưng ẩn nút "Đăng nhập với Google" cho tới khi
có credential thật, để không hiện nút hỏng. Để bật:

1. Tạo OAuth Client ID (loại "Web application") tại
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (dev) — thêm domain
   production khi deploy.
3. Điền `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` vào `.env`. Tuỳ chọn: đặt `GOOGLE_WORKSPACE_DOMAIN`
   để chỉ chấp nhận đăng nhập từ đúng domain Workspace công ty.
4. Đăng nhập Google chỉ hoạt động nếu email đó đã tồn tại sẵn trong bảng `User` (do Admin tạo qua
   trang Người dùng) — Google **không** tự tạo tài khoản mới, giữ đúng mô hình Admin cấp quyền.

## Stack

Next.js (App Router) + React + TypeScript · Tailwind CSS + shadcn/ui (Base UI) · Prisma 7 (driver
adapter `@prisma/adapter-pg`) + PostgreSQL · Auth.js v5 (Credentials + JWT session) · TanStack
Query · Zustand · React Hook Form + Zod · `@dnd-kit` (kéo-thả Kanban/Calendar/Timeline/Gantt) ·
`@anthropic-ai/sdk` (AI Command Center, Phase 8) · `qrcode` (QR chấm công động, Phase 11) ·
Vercel (deploy production tại vimove-os.vercel.app + Neon Postgres, xem NHAT-KY-KIEN-TRUC.md).

## Cấu trúc thư mục

```
app/
  (auth)/            login/ forgot-password/
  (protected)/       layout dùng chung (Sidebar + Topbar) cho dashboard/, admin/, work/
    dashboard/        Dashboard, Profile, Notifications
    admin/            Users, Departments, Teams, Roles, Permissions, Audit Logs, Settings
    work/             My Tasks, All Tasks (+ Task Detail), Kanban, Calendar, Timeline,
                       Gantt, Workload, Templates (Phase 2), Approval Hub (Phase 3)
    projects/          Dự án + chi tiết (Phase 3 — Project & Process)
    process/           Workflow Builder + Run log (Phase 3 — Project & Process)
    crm/               Lead, Khách hàng (Customer 360), Pipeline (Phase 4 — CRM & Sales)
    sales/             Đơn hàng, Sản phẩm, Kênh bán (Phase 4 — CRM & Sales)
    marketing/         Chiến dịch, Content Hub, Social, Landing Page, Email (Phase 5)
    integrations/      ads/ — Tích hợp quảng cáo (Phase 6, chưa verify sandbox thật)
    analytics/         Dashboard 6 tab, Report Builder, Data Quality Hub (Phase 7)
    ai/                Trợ lý AI, Insights, Approval Queue (Phase 8, chat chưa verify API thật)
    admin/observability/ Nhật ký lỗi thật (Phase 10 — Scale, permission observability.read)
    attendance/         Chấm công, Bảng công, Đơn nghỉ phép, Xếp ca, Địa điểm chấm công
                        (Phase 11), attendance/qr/[token]/ — trang đích quét QR
  lp/[slug]/          Landing page CÔNG KHAI (Phase 5) — ngoài (protected), không cần đăng nhập
  offline/            Trang fallback Service Worker khi mất mạng (Phase 10, public)
  api/lp/track/       Route Handler ghi touchpoint UTM + cookie visitorId (Phase 7)
  api/auth/          NextAuth route handler
  manifest.ts        Web App Manifest (Phase 10 — PWA, serve tại /manifest.webmanifest)
  global-error.tsx   Error boundary ngoài cùng (Phase 10 — Observability)
components/
  ui/                shadcn/ui (Base UI)
  layout/            Sidebar, Topbar, Breadcrumb, nav-config
  pwa/               ServiceWorkerRegister, InstallPrompt (Phase 10 — Scale)
  attendance/        CheckinPanel (GPS/QR/thủ công), QrDisplay (mã động), LocationDialog,
                     ShiftDialog, LeaveRequestDialog (Phase 11)
  shared/            PageHeader, EmptyState, PermissionDenied, KpiCard, ConfirmDeleteButton
  work/              Kanban board, Task dialog/detail tabs, Calendar/Timeline/Gantt/Workload views
  process/           Project badges/dialog, Approval card, Workflow canvas + node config, Run step list
  crm/               Lead card/dialog/detail/pipeline board, Customer dialog, Pipeline config
  sales/             Product/Channel dialog, Order dialog + status select
  marketing/         Campaign/Content dialog + board, Social/Landing Page/Email dialog, PublicLeadForm
  ads/               ConnectionCard (Kết nối/Đồng bộ/Ngắt kết nối, disabled thật khi chưa cấu hình)
  analytics/         Sparkline (SVG tự viết), Recompute/Scan button, Widget dialog/card, Issue list
  ai/                ChatPanel, NewConversationButton, GenerateInsightsButton, RecommendationCard
lib/
  auth/              RBAC helpers (requireSession/requirePermission/assertPermission), types
  permissions/       Danh mục permission (resource.action) + default role→permission mapping
  db/                Prisma client singleton (driver adapter)
  work/              Workload formula, date-grid helpers, Work Hub type unions, revalidate helper
  process/           Type union Project/Workflow/Approval + WorkflowDefinition JSON types
  crm/               Type union Pipeline/Lead + nhãn hiển thị
  sales/             Type union Order/SalesChannel + nhãn hiển thị
  marketing/         Type union Campaign/Content/Social/LandingPage/Email + nhãn hiển thị
  ads/               Type union AdPlatform/AdConnectionStatus/AdEntityStatus + nhãn hiển thị
  analytics/         Type union ReportDataset/Visualization + Dataset/Dimension/Metric registry
  ai/                Type union AiInsightType/RecommendationStatus/ActionStatus + nhãn hiển thị
  integrations/      legacy-vimove/ — LegacyVimoveAdapter (Phase 4); ads/ — AdsIntegrationProvider
                     interface + 4 provider stub (Phase 6); encryption.ts — AES-256-GCM token;
                     ai/claude.ts — wrapper gọi Claude API thật (Phase 8, chưa có API key)
  observability/     logger.ts (structured log + ghi ErrorLog), report-client-error.ts
                     (Server Action cầu nối cho error boundary Client Component) — Phase 10
  attendance/        types.ts (nhãn, hình thức chấm công còn thiếu + lý do thật),
                     geo.ts (distanceMeters Haversine thuần) — Phase 11
services/
  core/              Service layer CORE (users/departments/teams/roles/audit/...) — component/
                     action KHÔNG bao giờ gọi Prisma trực tiếp; observability.ts (Phase 10)
  tasks/             Service layer Work Hub (tasks/checklist/comments/attachments/
                     dependencies/watchers/time-logs/tags/templates/activity)
  projects/          Service layer Dự án (CRUD, thành viên, milestone, file)
  process/           Service layer Workflow (CRUD + version + publish), Workflow Engine
                     (chạy run thật), Approval (tạo/duyệt/huỷ/escalate), automation.ts
                     (Phase 9 — trigger workflow tự động từ event nghiệp vụ)
  crm/               Service layer Pipeline/Lead/Customer (CRUD, đổi giai đoạn, convert)
  sales/             Service layer Product/SalesChannel/Order (CRUD, tính tổng tiền)
  marketing/         Service layer Campaign (CRUD + tính KPI), Content, Social,
                     LandingPage (kể cả public getBySlug + submitForm), EmailCampaign
  ads/               Service layer AdConnection (connect/disconnect), sync (idempotent
                     upsert — chưa verify sandbox thật), dashboard (CTR/CPC/CPM)
  analytics/         Service layer events (writeEvent idempotent — Phase 9: event mới sẽ
                     gọi triggerWorkflowsForEvent), attribution (touchpoint/first-last-touch),
                     daily-metrics (rollup), reports (Report Builder engine + CSV),
                     data-quality (5 detector), domain-summaries (Work/Content/Sales/Executive)
  ai/                Service layer context (RBAC-scoped prompt), assistant (chat, chưa verify
                     API thật), insights (4 heuristic thật — Phase 9 thêm BUDGET_OPTIMIZATION),
                     recommendations (approve → thực thi thật qua service layer đã có → audit
                     log — verify được không cần API; Phase 9 thêm ADJUST_BUDGET)
  attendance/        locations, qr (sinh/xác thực token thật), checkin (GPS/QR/thủ
                     công, tự đổi Vào↔Ra), shifts, leave (wrap createApprovalRequest),
                     timesheet (tổng hợp bảng công thật, không suy đoán giờ thiếu) — Phase 11
prisma/              schema.prisma, seed.ts, migrations/
docs/                Phương án triển khai + tài liệu từng phase
```

## Ghi chú kỹ thuật quan trọng

- **Prisma 7** dùng driver adapter bắt buộc (`@prisma/adapter-pg`), client generate ra
  `app/generated/prisma` (không phải `node_modules`), config ở `prisma.config.ts` (không phải
  `url` trong `schema.prisma`).
- **`proxy.ts`** (không phải `middleware.ts` — quy ước mới của Next.js 16) dùng một `NextAuth`
  instance riêng dựng từ `auth.config.ts` (không import Prisma) vì middleware/proxy chạy Edge
  Runtime, không hỗ trợ Node builtin mà Prisma Client cần. Config đầy đủ (Credentials provider) chỉ
  nằm ở `auth.ts`, dùng cho route handlers/Server Actions/Server Components (Node.js runtime).
- **shadcn/ui bản này dùng Base UI** (`@base-ui/react`), không phải Radix — thành phần polymorphic
  dùng prop `render={<Element />}` thay vì `asChild`.
- Single-organization: mọi bảng nghiệp vụ vẫn có `organizationId` (chuẩn bị cho multi-tenant sau
  này) nhưng chỉ có 1 organization được seed sẵn, không có UI chọn tổ chức.
