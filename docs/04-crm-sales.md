# Phase 4 — CRM & Sales

Trạng thái: **hoàn thành và đã verify trong Browser preview với dữ liệu seed thật**
(migration áp dụng qua `prisma migrate dev` trực tiếp trên Postgres sống — không còn
cần kỹ thuật diff offline như Phase 2).

## Phạm vi đã làm

- Bảng: `Pipeline`, `PipelineStage`, `Customer`, `Lead`, `LeadActivity`, `Product`,
  `SalesChannel`, `Order`, `OrderItem`.
- Trang CRM: Lead (`/crm/leads` — pipeline board kéo-thả, `/crm/leads/[leadId]` — chi
  tiết + timeline hoạt động + đổi giai đoạn + convert), Khách hàng (`/crm/customers`,
  `/crm/customers/[customerId]` — Customer 360), Pipeline (`/crm/pipelines` — cấu hình
  pipeline/giai đoạn).
- Trang Sales: Đơn hàng (`/sales/orders`, `/sales/orders/[orderId]`), Sản phẩm
  (`/sales/products`), Kênh bán (`/sales/channels`).
- Task Detail (Phase 2) không đổi — CRM/Sales là domain độc lập, không có liên kết
  ngược tới Task ở phase này (đúng phạm vi roadmap, tránh pre-build).
- Permission mới: `leads.read/create/update/delete`, `customers.read/create/update/
  delete`, `orders.read/create/update/delete`, `sales_catalog.manage` (gộp quản lý
  pipeline/stage + sản phẩm + kênh bán dưới 1 quyền — cùng mức chi tiết với
  `task_templates.manage` ở Phase 2).
- `lib/integrations/legacy-vimove/adapter.ts` — interface `LegacyVimoveAdapter` +
  stub `NullLegacyVimoveAdapter` theo đúng yêu cầu roadmap Phase 4 ("chỉ interface +
  stub, chưa nối thật trừ khi có yêu cầu di trú dữ liệu cụ thể"). Chưa có yêu cầu di
  trú nào từ VimoveCRM tại thời điểm này nên chưa implement adapter thật.

## Quyết định kỹ thuật (để tránh mơ hồ khi đọc lại code)

1. **Pipeline/PipelineStage tuỳ biến được, không phải enum cố định.** Roadmap chỉ mô
   tả 1 luồng mặc định (NEW→CONTACTED→QUALIFIED→OFFER→NEGOTIATION→WON/LOST) nhưng bảng
   `pipelines`/`pipeline_stages` cho phép nhiều pipeline, mỗi pipeline tự đặt tên/số
   giai đoạn — seed tạo đúng 1 pipeline mặc định (`isDefault: true`) với 7 giai đoạn
   khớp roadmap. `PipelineStageType` (OPEN/WON/LOST) quyết định giai đoạn nào là điểm
   kết (WON tự set `wonAt`, LOST tự set `lostAt` khi lead chuyển tới).
2. **Lead pipeline board dùng `@dnd-kit` giống Kanban Work Hub (Phase 2)** nhưng cột
   động theo `PipelineStage` của DB thay vì `TaskStatus` cố định
   (`components/crm/lead-pipeline-board.tsx`). Không có cột `position` trên `Lead` —
   thứ tự trong 1 cột không được lưu (không thuộc nghiệm thu "chuyển đúng stage
   transition"), chỉ `stageId` được cập nhật khi kéo-thả.
3. **Convert Lead → Customer** (`convertLeadToCustomer` trong `services/crm/leads.ts`):
   không bắt buộc lead phải ở stage type WON mới convert được (Sales có thể chốt sớm
   khi deal gần như chắc chắn) — nút "Chuyển thành khách hàng" chỉ ẩn khi lead đã có
   `customerId` hoặc đang ở stage LOST. Nếu đã tồn tại `Customer` cùng email trong tổ
   chức, gắn lead vào customer đó thay vì tạo trùng (đối chiếu theo email).
4. **Customer 360** (`getCustomer360`) tính `totalRevenue` (LTV) từ tổng `Order.
   totalAmount` của các đơn **không** ở trạng thái CANCELLED/REFUNDED — không đơn giản
   cộng tất cả đơn để tránh sai lệch khi có hoàn tiền/huỷ.
5. **`unitPrice` trên `OrderItem` là snapshot tại thời điểm tạo đơn**, không đọc lại
   `Product.price` sau này — đúng nghiệp vụ hoá đơn (đổi giá sản phẩm sau không ảnh
   hưởng đơn cũ).
6. **Tiền tệ dùng Prisma `Decimal`**, nhưng **service layer luôn convert sang
   `number` trước khi trả về** (`Number(x)`) — `Decimal` là một class instance, không
   serialize được qua ranh giới Server Component → Client Component (Next.js RSC) và
   cũng không được phép làm giá trị trả về của Server Action gọi từ Client Component
   (lỗi "Only plain objects... Decimal objects are not supported" nếu vi phạm — đã gặp
   và sửa trong `createOrderAction`, xem mục Lỗi & cách sửa bên dưới).
7. **`sales_catalog.manage` gộp 3 domain quản trị** (Pipeline/Stage, Product, Sales
   Channel) dưới 1 permission — giống cách Phase 2 gộp `task_templates.manage`, tránh
   nổ số lượng permission cho các bảng "danh mục cấu hình" ít khi cần phân quyền chi
   tiết hơn.
8. **Base UI `Select` cần prop `items` tường minh để hiện đúng label khi ở trạng thái
   nghỉ (chưa mở dropdown).** Phát hiện lỗi thật khi verify: mọi `<Select>` có giá trị
   được set từ dữ liệu server (hoặc sau khi chọn rồi đóng dropdown) hiện **raw
   value/id** thay vì label, vì `Select.Value` chỉ resolve được nhãn từ tập `items` đã
   đăng ký lúc popup đang mở — đóng lại là mất. Cách sửa đúng theo tài liệu Base UI:
   truyền `items={Record<value, label>}` thẳng vào `<Select items={...}>` để
   `Select.Value` luôn resolve được nhãn bất kể popup đang mở hay đóng. Đã áp dụng cho
   toàn bộ Select mới ở Phase 4 (stage, nguồn lead, người phụ trách, loại kênh, trạng
   thái đơn, sản phẩm...). **Đây là lỗi có khả năng cũng tồn tại ở các Select từ Phase
   2/3** (TaskPriority, ProjectStatus...) — không sửa trong phase này vì ngoài phạm vi
   (đã flag riêng để xử lý sau, không cram nhiều phase/module vào 1 lần sửa).

## Kiểm tra đã thực hiện (browser, dữ liệu seed thật)

1. `/crm/leads`: pipeline board hiện đủ 7 cột với đúng số lead seed mỗi giai đoạn; kéo
   thả lead "Cửa hàng Minh Phát" từ "Đã liên hệ" sang "Đạt yêu cầu" → reload lại vẫn
   giữ đúng cột (persist thật, không phải optimistic-only).
2. Lead Detail: đổi giai đoạn qua Select ghi đúng `LeadActivity` loại STAGE_CHANGED
   ("Mới → Đã liên hệ"); thêm hoạt động thủ công (Ghi chú) hiện ngay trong timeline;
   "Chuyển thành khách hàng" tạo `Customer` mới, ẩn nút sau khi convert, hiện link
   khách hàng ở sidebar.
3. Customer 360 (`seed-customer-1`): LTV hiện đúng 85.000.000đ (tổng 2 dòng seed
   order), đúng 1 đơn/1 lead/1 lead thắng; tab Đơn hàng/Lead hiện đúng dữ liệu liên
   kết.
4. `/sales/orders`: tạo đơn hàng mới cho khách hàng đã convert — chọn sản phẩm, tổng
   tiền tính đúng theo giá x số lượng, đơn xuất hiện ngay trong danh sách và trong tab
   Đơn hàng của Customer 360.
5. Order Detail: đổi trạng thái đơn qua Select (Đã xác nhận → Đã giao) — cập nhật
   ngay, không lỗi.
6. `/crm/pipelines`, `/sales/products`, `/sales/channels`: CRUD danh mục hoạt động,
   hiện đúng badge trạng thái/loại.
7. `npx tsc --noEmit`, `npm run lint`, `npm run build` — cả 3 pass sạch, 0 lỗi/cảnh
   báo (37 route, gồm 4 route index-redirect mới).

## Lỗi & cách sửa (trong lúc verify)

- **Breadcrumb dẫn tới trang không tồn tại**: `/crm`, `/sales` (và phát hiện luôn
  `/work`, `/process` từ Phase 2/3 có cùng lỗi) không có `page.tsx` — breadcrumb segment
  cha vẫn render thành link, bấm vào sẽ 404 (vi phạm §3 rule 6). Sửa bằng cách thêm 4
  trang index nhỏ dùng `redirect()` về route con mặc định hợp lý (`/crm` →
  `/crm/leads`, `/sales` → `/sales/orders`, `/work` → `/work/my-tasks`, `/process` →
  `/process/workflows`).
- **Server Action trả về object chứa Prisma `Decimal`**: `createOrderAction` ban đầu
  `return order` (bao gồm `totalAmount`/`unitPrice`/`lineTotal` dạng Decimal) cho
  `OrderDialog` (Client Component) — Next.js báo lỗi runtime "Only plain objects can be
  passed to Client Components... Decimal objects are not supported". Sửa bằng cách bỏ
  `return` (component gọi action không cần giá trị trả về, chỉ cần biết Promise đã
  resolve).
- **Base UI Select hiện raw value khi nghỉ** — xem mục quyết định kỹ thuật #8 ở trên.

## Ghi chú môi trường

Không có gì khác biệt so với Phase 3 — Docker Postgres đã sẵn sàng, migration áp dụng
trực tiếp qua `prisma migrate dev`, không cần env var mới.
