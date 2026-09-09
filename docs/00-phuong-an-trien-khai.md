# VIMOVE OS — Phương án triển khai

Nguồn yêu cầu: `VIMOVE_OS_Kien_Truc_Tong_The_Chi_Tiet_Vibe_Code.docx` (37 mục). Tài liệu này chuyển
đặc tả đó thành một phương án thi công có thứ tự, có mốc nghiệm thu, và nêu rõ các điểm cần quyết
định trước khi code.

## 0. Quyết định nền tảng đã chốt

- **Build mới hoàn toàn** trong thư mục `VIMOVE OS/`, không tái sử dụng code của `VimoveCRM`.
- `VimoveCRM` (NestJS api + Next.js web, đang chạy thật trên Railway/Vercel/Supabase) được coi là
  **Legacy VIMOVE** theo đúng §26 của đặc tả: không xoá, không sửa; VIMOVE OS đọc/ghi qua một
  **Legacy Adapter** riêng, không bao giờ trỏ thẳng Prisma của VIMOVE OS vào database của VimoveCRM.
- Vì đây là hệ thống mới, phase đầu KHÔNG cần Legacy Adapter chạy thật — chỉ cần thiết kế interface
  (`LegacyVimoveAdapter`) và stub, nối thật khi có nhu cầu di trú dữ liệu cụ thể (ví dụ: import
  danh sách khách hàng/đơn hàng cũ). Việc này để ở Phase 4 (CRM & Sales) trở đi, không chặn Phase 1–3.

## 1. Các quyết định nền tảng đã chốt (2026-09-08)

1. **Single-org, không multi-tenant UI**: VIMOVE OS chỉ phục vụ nội bộ công ty VIMOVE. Vẫn giữ cột
   `organizationId` trên mọi bảng nghiệp vụ (đúng đặc tả, dễ mở rộng sau này) nhưng **seed sẵn 1
   organization mặc định**, không làm UI "Select Organization"/org switcher ở Phase 1. Middleware/
   service layer vẫn luôn gắn `organizationId` (không cho client tự chọn tenant — đúng §21), chỉ là
   giá trị luôn cố định thay vì user chọn.
2. **AI provider = Claude (Anthropic)**: AI Command Center (Phase 8) gọi Claude API thay vì OpenAI.
   Bỏ `OPENAI_API_KEY` khỏi env thật, dùng `ANTHROPIC_API_KEY`. Không chặn Phase 1-7.
3. **Postgres = Vercel Postgres / Neon**: chọn khi tới lúc deploy thật (không chặn việc viết
   `prisma/schema.prisma` và chạy local bằng Postgres qua Docker ở Phase 1) — sẽ dùng Neon (Vercel
   Postgres hiện chạy nền Neon) để tích hợp liền mạch với pipeline Vercel, tách biệt hoàn toàn với
   Supabase của VimoveCRM.
4. **Ads/Zalo/Shopee OAuth app thật**: vẫn là việc cần chuẩn bị riêng (Meta App ID/Secret, Google
   Ads Developer Token, TikTok App, Zalo OA App) trước khi Phase 6 verify được với sandbox thật —
   không chặn Phase 1-5, giống tình trạng VimoveCRM Phase 6/7 lúc trước.

## 2. Kiến trúc kỹ thuật (tóm tắt, xem docx gốc để biết đầy đủ)

```
UI (Next.js/React/TS)
  ↓
Route Handler / Server Action
  ↓
Validation (Zod) / Authorization (RBAC server-side)
  ↓
Application Service (services/)
  ↓
Domain Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL
```

- **Frontend**: Next.js (App Router) + React + TypeScript, Tailwind + shadcn/ui, Recharts (charts),
  React Flow (Workflow Builder), React Hook Form + Zod, TanStack Query (server state), Zustand
  (client state).
- **Backend**: cùng Next.js app — Route Handlers/Server Actions + Service Layer, KHÔNG có service
  NestJS riêng (khác VimoveCRM).
- **DB**: PostgreSQL + Prisma, mọi bảng nghiệp vụ có `organizationId`.
- **Jobs**: Vercel Cron cho job nhẹ/định kỳ; hàng đợi (Redis/Upstash hoặc tương đương) + worker cho
  job dài (đồng bộ ads, tính attribution, AI analysis) — không giữ HTTP request lâu.
- **Storage**: Vercel Blob cho file đính kèm.
- **Bảo mật**: mã hoá token/credential OAuth, không log secret, không expose secret ra client, verify
  chữ ký webhook, rate limit cho auth/webhook, CSRF cho cookie session.

### Cấu trúc thư mục (giữ đúng đặc tả §25)

```
app/
  (auth)/
  dashboard/
  work/            my-tasks/ tasks/ kanban/ calendar/ timeline/ gantt/ workload/ approvals/
  projects/
  process/
  marketing/       dashboard/ campaigns/ ads/ content/ social/ landing-pages/ email/ automation/
  crm/
  sales/
  analytics/
  ai/
  integrations/
  admin/
  api/
components/        ui/ layout/ work/ projects/ marketing/ crm/ analytics/ ai/ integrations/
lib/               db/ auth/ permissions/ encryption/ integrations/ analytics/ attribution/ automation/ ai/
services/          tasks/ projects/ marketing/ crm/ ads/ sync/ reports/ notifications/ ai/
workers/           ads/ orders/ analytics/ ai/
prisma/
  schema.prisma
docs/              (tài liệu này + PRD/kiến trúc từng phase, theo đúng mô hình VimoveCRM/docs)
```

## 3. Quy tắc thi công (áp dụng đúng §34 đặc tả)

1. Đọc toàn bộ đặc tả trước khi code từng phase.
2. Không build toàn bộ hệ thống trong một lần — mỗi phase là một lần trao đổi/PR riêng.
3. Mỗi phase phải xong "nền" cần thiết trước khi phase sau mở rộng lên trên.
4. Sau mỗi phase: chạy lint, typecheck, test, `next build` production — báo cáo kết quả.
5. Seed data tách khỏi luồng production (script riêng, không chạy tự động khi build).
6. Không tạo nút/hành động giả (mọi button phải có logic thật hoặc rõ ràng "Coming soon" có
   disabled state — không im lặng làm màu).
7. Mọi trang phải có đủ 4 trạng thái: Loading, Empty, Error, Permission Denied.
8. Không đưa secret vào client bundle.
9. Component không bao giờ gọi Prisma trực tiếp — luôn qua service layer.
10. Mọi tích hợp bên ngoài đi qua adapter (`lib/integrations/<provider>/`), không gọi thẳng SDK
    provider trong route handler.
11. Hành động AI có ảnh hưởng nghiệp vụ (đổi budget, pause ads...) bắt buộc có bước duyệt của
    người dùng ở các phase đầu — AI không tự quyết định chi tiền.
12. Mỗi phase khi báo cáo phải liệt kê: file thay đổi, migration, route mới, API mới, env var mới,
    kết quả test, việc còn tồn đọng.

Mỗi phase nên có một file PRD/kiến trúc ngắn trong `docs/` (theo đúng mô hình `VimoveCRM/docs`),
viết sau khi phase đó được chốt phạm vi — không viết trước toàn bộ 10 phase một lúc để tránh lệch
với thực tế lúc code.

## 4. Roadmap 10 phase — phạm vi & nghiệm thu cụ thể

### Phase 1 — Foundation
**Phạm vi**: khởi tạo Next.js + TS + Tailwind + shadcn/ui; Prisma schema cho CORE
(`organizations, users, departments, teams, roles, permissions, role_permissions, user_roles`);
NextAuth (hoặc tương đương) cho đăng nhập; RBAC server-side (permission theo `resource.action`);
layout chuẩn (Sidebar + Topbar + Breadcrumb + Page Header + Filter Bar + Content) dùng màu xanh lá
VIMOVE; Dashboard shell rỗng (khung KPI card, chưa có số liệu thật); deploy lên Vercel.
**Nghiệm thu**: đăng nhập được, tenant isolation hoạt động (2 user khác organization không thấy
dữ liệu của nhau), layout responsive, `next build` pass trên Vercel.

### Phase 2 — Work Hub
**Phạm vi**: bảng `tasks` + các bảng liên quan (checklist, comment, attachment, dependency, watcher,
activity, time_log, tag, template); trang My Tasks, All Tasks, Kanban (drag/drop cập nhật server),
Calendar/Timeline/Gantt (reschedule cập nhật `dueAt`), Workload (theo ngưỡng %), Task Detail đầy đủ.
**Nghiệm thu**: CRUD task, đổi status qua Kanban lưu DB thật, Gantt thể hiện dependency và chặn thao
tác vi phạm dependency, Workload tính đúng theo user/team.

### Phase 3 — Project & Process
**Phạm vi**: `projects` + members/milestones/files/templates; Workflow Builder (React Flow) với node
Trigger/Action/Condition/Approval/Delay/Parallel/Webhook/AI; `workflow_versions` (không sửa version
đang chạy); `workflow_runs`/`workflow_run_steps` với retry + error log; Approval Hub dùng chung cho
Task/Content/Creative/Campaign/Budget/Purchase.
**Nghiệm thu**: tạo workflow bằng kéo-thả, chạy thử ra đúng run log, approval sequential/parallel
hoạt động, SLA + escalation cơ bản.

### Phase 4 — CRM & Sales
**Phạm vi**: `customers, leads, lead_activities, pipelines, pipeline_stages, products, orders,
order_items, sales_channels`; pipeline NEW→CONTACTED→QUALIFIED→OFFER→NEGOTIATION→WON/LOST;
Customer 360. Bắt đầu thiết kế `LegacyVimoveAdapter` interface (đọc customer/order cũ nếu cần đối
chiếu — chỉ interface + stub, chưa nối thật trừ khi có yêu cầu di trú dữ liệu cụ thể).
**Nghiệm thu**: lead chuyển stage đúng transition, order liên kết customer/product/channel, Customer
360 tổng hợp đúng dữ liệu.

### Phase 5 — Marketing
**Phạm vi**: `campaigns, campaign_channels, content, content_assets, social_accounts, social_posts,
landing_pages, landing_forms, form_submissions, email_campaigns`; Content Hub theo trạng thái
Idea→Brief→Script→Production→Review→Approved→Scheduled→Published; Campaign liên kết Project/Task.
**Nghiệm thu**: Campaign dashboard hiện được Spend/Revenue/ROAS/Leads/CPL/Orders/CAC/Profit (có thể
là 0/placeholder nếu Ads chưa nối ở Phase 6, nhưng công thức và luồng dữ liệu phải đúng).

### Phase 6 — Ads Integration
**Phạm vi**: `ad_connections, ad_accounts, ad_campaigns, ad_adsets, ads, ad_creatives,
ad_metrics_daily`; `IntegrationProvider` interface + `MetaAdsProvider`/`GoogleAdsProvider`/
`TikTokAdsProvider`/`ZaloProvider` (và Shopee/TikTok Shop/Pancake nếu cần ở phase này hoặc sau);
OAuth flow đầy đủ, mã hoá token, initial sync + scheduled sync (cron/queue), chuẩn hoá metrics.
**Nghiệm thu**: OAuth không lộ credential ra client/log, sync job idempotent (chạy lại không tạo
trùng), `ad_metrics_daily` có `currency`/`timezone` chuẩn hoá và `syncedAt` freshness timestamp.
Cần app credentials thật theo mục 1.3 ở trên — nếu chưa có, phase này dừng ở "code xong, chưa verify
sandbox thật" giống VimoveCRM Phase 6/7.

### Phase 7 — Analytics
**Phạm vi**: `events, attribution_events, attribution_touchpoints, daily_metrics, reports,
report_widgets, data_quality_issues`; Attribution (UTM, first-touch/last-touch, idempotency key
chống duplicate event); Executive/Work/Marketing/Ads/Sales/Content dashboard; Report Builder
(Dataset→Dimension→Metric→Filter→Grouping→Visualization, export CSV/XLSX/PDF, scheduled report qua
email); Data Quality Hub (sync failure, missing UTM, duplicate, stale account, mismatch).
**Nghiệm thu**: các công thức Revenue/Profit/ROAS/ROI/CAC/CPL/CTR/CPC/CPM/Conversion Rate/AOV tính
đúng trên dữ liệu seed, report builder tự tạo report và export được, data quality issue tự phát
hiện được ít nhất 1 case seed sẵn.

### Phase 8 — AI Command Center
**Phạm vi**: `ai_conversations, ai_messages, ai_insights, ai_recommendations, ai_actions,
ai_action_logs`; AI Work Assistant (trả lời dựa trên dữ liệu user được phép xem — tôn trọng RBAC),
AI Manager (bottleneck/workload/overdue/project health), AI Marketing Analyst (anomaly ROAS/CPL/CPC/
spend/revenue kèm số liệu chứng minh), AI Report; luồng Insight→Recommendation→User Approval→
Action→Result→Audit Log; Approval Queue cho sensitive action.
**Nghiệm thu**: AI trả lời đúng phạm vi quyền của user hỏi (không lộ dữ liệu tổ chức khác/phòng ban
khác nếu không có quyền), mọi AI action nhạy cảm (đổi budget, pause ad...) chỉ thực thi sau khi user
bấm duyệt, có log đầy đủ trong `ai_action_logs`.

### Phase 9 — Optimization
**Phạm vi**: AI hỗ trợ tối ưu budget/creative/audience với action có kiểm soát (vẫn qua approval
queue của Phase 8, không tự động chi tiền); Automation Engine đầy đủ (trigger/condition/action theo
§19) áp dụng cho cả Work/Marketing/CRM.
**Nghiệm thu**: automation rule chạy đúng trigger→condition→action, có execution log/retry/
idempotency; đề xuất tối ưu của AI có số liệu evidence trước khi user duyệt.

### Phase 10 — Scale
**Phạm vi**: tách job nặng sang queue/worker thật (nếu Phase 6-9 mới dùng cron đơn giản), caching,
performance tuning (index, N+1), mobile/PWA, observability (error tracking, structured log),
advanced permissions (scope theo project/department nếu cần, tương tự VimoveCRM Phase 9/12).
**Nghiệm thu**: có benchmark trước/sau tối ưu, PWA cài được trên mobile, dashboard lỗi/observability
hoạt động.

## 5. Rủi ro chính

- **Scope rất lớn** (9 lớp, 10 phase) — nếu cố gộp nhiều phase vào 1 lần code, rất dễ tạo ra
  "fake button"/nửa vời, vi phạm đúng quy tắc §34 của chính đặc tả. Bắt buộc đi từng phase, nghiệm
  thu xong mới sang phase kế.
- **Ads/OAuth integration (Phase 6)** phụ thuộc credential thật từ bên ngoài (Meta/Google/TikTok/
  Zalo) — không có trong tầm kiểm soát kỹ thuật thuần, cần người dùng chuẩn bị trước.
- **Không có Legacy Adapter sống ngay từ đầu** — nếu về sau phát sinh nhu cầu "VIMOVE OS phải thấy
  dữ liệu cũ của VimoveCRM ngay từ Phase 1-2", phương án này sẽ cần điều chỉnh sớm hơn dự kiến (hiện
  đang đặt ở Phase 4). Nên xác nhận sớm nếu có yêu cầu đó.

## 6. Bước tiếp theo

Các quyết định nền tảng đã chốt (mục 1) — sẵn sàng bắt đầu Phase 1: `npx create-next-app`, cấu hình
Tailwind/shadcn, viết `prisma/schema.prisma` cho nhóm CORE (kèm 1 organization mặc định trong seed),
dựng layout + auth + RBAC khung, deploy Vercel rỗng để xác nhận pipeline CI/CD hoạt động trước khi
build tính năng.
