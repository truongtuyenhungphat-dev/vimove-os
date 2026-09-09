# VIMOVE OS — Nhật ký kiến trúc & vận hành

> Tài liệu này ghi lại đầy đủ trạng thái, kiến trúc, và thông tin vận hành để **bất kỳ
> ai (hoặc AI agent nào) cũng có thể tiếp tục dự án từ một máy khác** mà không cần dò
> lại từ đầu. Đọc file này trước, sau đó đọc [README.md](README.md) (trạng thái từng
> phase) và `docs/0N-*.md` (quyết định kỹ thuật chi tiết từng phase) khi cần sâu hơn.
>
> **Quy ước bắt buộc**: mỗi lần có thay đổi đáng kể (deploy mới, đổi hạ tầng, thêm
> phase, đổi quyết định kiến trúc...) → cập nhật mục "Lịch sử cập nhật" bên dưới VÀ
> tăng số Ver ở dòng cuối file. Không tăng version cho sửa lỗi nhỏ/gõ nhầm.

## Lịch sử cập nhật

| Ver | Ngày | Nội dung |
|-----|------|----------|
| 1 | 2026-09-09 | Khởi tạo tài liệu. Hoàn thành Phase 1-10 (toàn bộ roadmap). Deploy production lên Vercel + Neon Postgres, verify end-to-end (login thật, DB thật). |

---

## 1. Dự án này là gì

Business Operating System nội bộ cho VIMOVE: Work Hub + Process Hub + Marketing Hub +
CRM/Sales + Analytics + AI Command Center — hợp nhất trong 1 hệ thống, thay thế dần hệ
thống cũ (Legacy VimoveCRM, không đụng vào, chỉ nối qua adapter khi cần).

Xây dựng theo phương án 10 phase tại [docs/00-phuong-an-trien-khai.md](docs/00-phuong-an-trien-khai.md).
**Cả 10 phase đã hoàn thành** (xem bảng trạng thái trong README.md). 2 phần bị chặn vì
thiếu credential ngoài (không phải lỗi code): Ads Integration (Phase 6, cần OAuth
Meta/Google/TikTok/Zalo) và AI Work Assistant chat thật (Phase 8, cần
`ANTHROPIC_API_KEY`). Mọi thứ khác đã verify thật với dữ liệu/session thật.

## 2. Stack & kiến trúc cốt lõi (tóm tắt — chi tiết xem README.md)

- **Next.js 16** (App Router, Turbopack, Server Components/Actions) + **React 19** +
  **TypeScript**.
- **Prisma 7** — client generate ra TS source (`app/generated/prisma`, gitignored,
  PHẢI chạy `prisma generate` trước khi build/chạy — xem §5 về `postinstall`).
  Driver adapter `@prisma/adapter-pg` (`lib/db/client.ts`), **không dùng URL trong
  `schema.prisma`** — connection string app runtime lấy trực tiếp từ
  `process.env.DATABASE_URL`. Prisma CLI (migrate/studio) lấy URL riêng từ
  `prisma.config.ts` (xem §5, quan trọng — 2 connection khác nhau khi dùng Neon).
- **PostgreSQL**: local dev = Docker (`docker-compose.yml`, port 5437). Production =
  Neon (serverless Postgres qua Vercel Marketplace, xem §4).
- **Auth.js v5** (Credentials + JWT session, RBAC server-side). **Permission chỉ
  refresh khi đăng nhập lại** — sau mỗi lần đổi permission/scope, phải đăng xuất/đăng
  nhập lại mới thấy hiệu lực (đã lặp lại nhiều lần xuyên suốt dự án, không phải bug).
- **Tailwind CSS + shadcn/ui trên nền Base UI** (không phải Radix) — Select cần prop
  `items` tường minh để hiện đúng label lúc đóng (bug pattern đã gặp nhiều lần, xem
  `docs/04-crm-sales.md`).
- Quy ước service layer: `services/<domain>/*.ts`, `"server-only"`, hàm nhận
  `organizationId` đầu tiên, không có repository layer, ghi `writeAuditLog` sau mutation.
  Component/Server Action **không bao giờ gọi Prisma trực tiếp**.
- Permission dạng `resource.action` (`lib/permissions/catalog.ts`), scope nâng cao
  ALL/DEPARTMENT/OWN từ Phase 10 (`lib/permissions/role-defaults.ts`).

## 3. Cấu trúc thư mục

Xem mục "Cấu trúc thư mục" trong [README.md](README.md) — được cập nhật đầy đủ qua
từng phase, là nguồn chính xác nhất, không lặp lại ở đây để tránh 2 nơi lệch nhau.

## 4. Hạ tầng Production hiện tại

| Thành phần | Giá trị |
|---|---|
| **URL Production** | https://vimove-os.vercel.app |
| **Vercel account** | `truongtuyenhungphat-3713` (đăng nhập qua device-flow OAuth trong phiên làm việc trước) |
| **Vercel org/scope** | `vimove` (orgId `team_m3jTAPdfrtmMiBFM5kicZtMY`) |
| **Vercel project** | `vimove-os` (projectId `prj_DqAxDjpfKAd85kTITcLehNDO7fjy`) |
| **Database** | Neon Postgres, cài qua Vercel Marketplace integration (tên resource `neon-gray-lens`) — connection string tự động bơm vào biến môi trường Vercel, KHÔNG cần tài khoản Neon riêng để quản lý (quản lý qua chính Vercel dashboard → Storage). |
| **Biến môi trường đã set trên Vercel** (Production/Preview/Development) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (+ các biến `PG*`/`POSTGRES_*` do Neon tự thêm), `AUTH_SECRET` (sinh riêng cho production, khác giá trị dev), `ENCRYPTION_KEY` (sinh riêng cho production) |
| **Biến môi trường CHƯA set (để trống có chủ đích)** | `ANTHROPIC_API_KEY`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `META_*`/`GOOGLE_ADS_*`/`TIKTOK_*`/`ZALO_*`, `REDIS_URL`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` — app đã thiết kế để chạy tốt khi thiếu các biến này (tính năng liên quan tự ẩn/báo "chưa cấu hình", không crash) |
| **Git remote** | **CHƯA CÓ** — repo chỉ có commit local (xem §6, đây là việc cần làm đầu tiên nếu muốn CI/CD tự động qua GitHub) |

### Cách redeploy / cập nhật production

```bash
# Từ thư mục gốc dự án, đã link sẵn qua .vercel/project.json (gitignored — xem §6
# nếu làm trên máy mới chưa có file này)
npx vercel --prod --yes
```

### Cách chạy migration mới lên production (Neon)

**Quan trọng**: Prisma CLI (`migrate`) PHẢI dùng connection **không pooled**
(`DATABASE_URL_UNPOOLED`, không có hậu tố `-pooler` trong hostname) — connection pooled
qua PgBouncer không hỗ trợ prepared statement, sẽ lỗi `prepared statement already
exists`. `prisma.config.ts` đã tự ưu tiên `DATABASE_URL_UNPOOLED` nếu biến đó tồn tại
trong môi trường đang chạy lệnh. Lấy 2 giá trị này qua `npx vercel env pull` hoặc
dashboard Vercel → Storage → Neon → `.env.local`, rồi:

```bash
# PowerShell — set tạm cho đúng 1 lệnh, không sửa file local
$env:DATABASE_URL_UNPOOLED="<connection string KHÔNG có -pooler>"
$env:DATABASE_URL="<connection string CÓ -pooler>"
npx prisma migrate deploy
```

### Cách seed lại / seed production (cẩn thận — ghi đè theo `id` cố định, idempotent)

```bash
# Set 2 biến như trên rồi:
npx prisma db seed
```

### Tài khoản đăng nhập hiện có trên production

```
admin@vimove.vn / ChangeMe123!       (SUPER_ADMIN)
marketing@vimove.vn / ChangeMe123!   (MARKETING_STAFF)
sales@vimove.vn / ChangeMe123!       (SALES)
```

⚠️ Đây là mật khẩu demo mặc định từ `prisma/seed.ts` — **đổi ngay** (Dashboard →
Profile) vì URL production đã public. Toàn bộ dữ liệu hiện tại (công ty/lead/campaign)
là **dữ liệu demo/seed**, không phải dữ liệu thật.

## 5. Điểm khác biệt quan trọng giữa local dev và production (dễ gây lỗi nếu quên)

1. **`postinstall: "prisma generate"`** trong `package.json` — bắt buộc, vì Vercel
   build không tự chạy lệnh này (khác máy local, nơi ta chạy tay). Thiếu dòng này →
   build production lỗi `Module not found: Can't resolve '@/app/generated/prisma/client'`.
2. **`prisma.config.ts`** đọc `DATABASE_URL_UNPOOLED ?? DATABASE_URL` cho Prisma CLI —
   local dev (Docker Postgres) không có khái niệm pooled nên tự fallback đúng về
   `DATABASE_URL`, không cần cấu hình gì thêm khi dev local.
3. **`.vercelignore`** loại `.claude/`, `.agents/`, `.windsurf/`, `docs/`,
   `app/generated/` khỏi gói deploy — các thư mục skill/tool nặng (~10MB) từng khiến
   `vercel deploy` liên tục lỗi `fetch failed` giữa chừng upload (đã tự retry 5 lần
   trước khi tìm ra nguyên nhân thật).
4. **`AUTH_SECRET`/`ENCRYPTION_KEY` production KHÁC giá trị `.env` local** — sinh riêng
   lúc deploy, không copy từ máy dev.

## 6. Chuyển sang làm tiếp trên máy khác — checklist

1. **Lấy code**: repo hiện **chưa có git remote**. Chọn 1 trong 2:
   - Đẩy lên GitHub/GitLab riêng (`git remote add origin <url> && git push -u origin main`),
     rồi `git clone` trên máy mới. Khuyến nghị nếu muốn dùng Vercel Git Integration
     (tự deploy mỗi lần push, xem gợi ý Vercel đã in ra lúc `vercel link`:
     "To deploy every commit automatically, connect a Git Repository").
   - Hoặc copy trực tiếp cả thư mục dự án (kể cả `.git/`) sang máy mới qua USB/mạng nội bộ.
2. **Cài dependency**: `npm install` (tự chạy `postinstall` → `prisma generate`).
3. **Dev local**: cần Docker chạy `docker compose up -d` (Postgres port 5437), tạo
   `.env` từ `.env.example`, `npx prisma migrate dev`, `npx prisma db seed`.
4. **Nối lại Vercel project đã có** (không tạo project mới):
   ```bash
   npx vercel login          # đăng nhập lại — cần quyền truy cập vào org "vimove"
   npx vercel link --yes --project vimove-os
   npx vercel env pull       # lấy .env.local (Neon connection string, secrets)
   ```
   Nếu máy mới không có quyền truy cập tài khoản Vercel `truongtuyenhungphat-3713` /
   org `vimove` → cần được mời (invite) vào project qua Vercel dashboard trước.
5. Đọc mục 2-5 ở trên trước khi sửa bất cứ gì liên quan tới Prisma/deploy — 2 lỗi ở §5
   (postinstall, .vercelignore) đã tốn nhiều lượt thử mới tìm ra, đừng lặp lại.

## 7. Việc còn dang dở (không phải bug — chờ input bên ngoài)

- **Ads Integration (Phase 6)**: code đầy đủ, cần credential OAuth thật (Meta/Google
  Ads/TikTok/Zalo) để verify sandbox — xem `docs/06-ads-integration.md`.
- **AI Work Assistant chat (Phase 8)**: cần `ANTHROPIC_API_KEY` để verify trả lời thật
  — xem `docs/08-ai-command-center.md`. Phần Insight→Recommendation→Approval→Action
  của AI Command Center đã verify thật, KHÔNG cần API key.
- **Job queue/worker thật + Cache Components (`"use cache"`)**: cân nhắc ở Phase 10
  nhưng cố ý chưa làm — lý do chi tiết trong `docs/10-scale.md`.
- **Icon PWA**: mới có SVG, chưa có bộ PNG 192/512 thiết kế riêng.
- **Git remote**: chưa có (xem §6 mục 1).

## 8. Liên hệ / tài liệu liên quan

- [README.md](README.md) — trạng thái từng phase, cấu trúc thư mục đầy đủ.
- [docs/00-phuong-an-trien-khai.md](docs/00-phuong-an-trien-khai.md) — phương án gốc, quyết định nền tảng.
- `docs/01-10-*.md` — quyết định kỹ thuật + giới hạn từng phase.

---

**Ver 1 · Made by Trương Tuyền · 0966912268**
