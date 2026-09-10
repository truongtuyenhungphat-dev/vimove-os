# Phase 11 — Chấm công (Attendance & Timekeeping)

Trạng thái: **Hoàn thành, verify đầy đủ với dữ liệu/luồng thật.** Không nằm trong 10
phase gốc của roadmap — thêm theo yêu cầu người dùng, tham chiếu tính năng của
[MISA AMIS Chấm Công](https://amis.misa.vn/amis-cham-cong/).

## Quyết định phạm vi (để không tạo "fake button")

MISA AMIS hỗ trợ 5 hình thức chấm công: máy vân tay, GPS, FaceID, QR code, Wifi nội
bộ. Trên 1 web app thuần (không có app native/phần cứng riêng), chỉ **3 hình thức làm
được thật**:

| Hình thức | Có làm thật không | Cơ chế |
|---|---|---|
| Thủ công | ✅ | Nút bấm, ghi timestamp thật |
| GPS | ✅ | `navigator.geolocation` (trình duyệt) + Haversine tính khoảng cách thật tới địa điểm đã cấu hình, từ chối rõ ràng nếu ngoài bán kính |
| QR động | ✅ | Sinh token thật trong DB (đổi mỗi 20s), quét bằng camera điện thoại (không tự viết trình quét — mở thẳng URL) |
| Wifi nội bộ | ❌ | Trình duyệt không có API đọc SSID đang kết nối |
| FaceID | ❌ | Cần mô hình nhận diện khuôn mặt + phần cứng camera ngoài phạm vi web app |
| Máy vân tay | ❌ | Cần tích hợp phần cứng vật lý riêng của nhà sản xuất |

3 hình thức không làm được hiện dưới dạng **pill bị vô hiệu hoá kèm tooltip giải
thích lý do thật** (`lib/attendance/types.ts#UNAVAILABLE_ATTENDANCE_METHODS`) —
không ẩn đi (người dùng biết tính năng này tồn tại ở MISA nhưng chưa làm được ở đây),
không giả lập hoạt động.

**Tính lương tự động** (module lớn riêng của MISA) — cố ý **không làm** ở phase này,
đã trao đổi trước với người dùng khi chốt phạm vi: dữ liệu chấm công/bảng công đã đủ
thật để làm nguồn cho 1 phase tính lương riêng sau này nếu cần.

## Kiến trúc

### Data model (`prisma/schema.prisma`, migration `attendance_timekeeping`)

- `AttendanceLocation` — địa điểm văn phòng (toạ độ + bán kính) làm tâm cho GPS + nơi
  gắn QR.
- `AttendanceRecord` — 1 dòng = 1 lượt chấm công thật (CHECK_IN/CHECK_OUT), append-
  only (không sửa/xoá được sau khi tạo, giống AuditLog) — `method` MANUAL/GPS/QR,
  kèm toạ độ + khoảng cách thật đã tính nếu là GPS/QR.
- `QrCheckinToken` — token QR động, hết hạn sau 20s (`QR_TOKEN_TTL_SECONDS`).
- `Shift` + `ShiftAssignment` — mẫu ca (giờ bắt đầu/kết thúc dạng "HH:mm", nghỉ giữa
  ca) + xếp ca theo ngày (unique `[userId, date]` — xếp lại là ghi đè).
- `LeaveType` + `LeaveRequest` — đơn nghỉ phép, **KHÔNG tự có luồng duyệt riêng**:
  `LeaveRequest.approvalRequestId` trỏ thẳng vào `ApprovalRequest` đã có sẵn từ
  Process Hub (Phase 3) — thêm `LEAVE` vào enum `ApprovalEntityType`, dùng lại y
  nguyên `createApprovalRequest()`/`decideStep()`/`escalateOverdueSteps()`, hiện đúng
  trong `/work/approvals` cùng với duyệt Task/Content/Campaign — không xây hệ thống
  duyệt đơn thứ 2.

### Permission

`attendance.read` (scope OWN/DEPARTMENT/ALL — thêm vào
`SCOPABLE_PERMISSIONS`, cùng cơ chế với `tasks.read`/`leads.read` từ Phase 10),
`attendance.manage` (cấu hình ca/địa điểm — chỉ SUPER_ADMIN/ADMIN),
`leave_requests.create`. Role cá nhân → OWN, Trưởng phòng → DEPARTMENT, role giám sát
(SUPER_ADMIN/ADMIN/DIRECTOR/ANALYST/VIEWER) → ALL — đúng pattern đã lập ở Phase 10.

### Services (`services/attendance/*.ts`)

`locations.ts`, `qr.ts` (sinh + xác thực token thật), `checkin.ts`
(`checkInOrOut()` — tự quyết định vào/ra dựa trên bản ghi gần nhất trong ngày, không
cho chọn tay để tránh 2 lượt "vào" liên tiếp), `shifts.ts`, `leave.ts` (wrap
`createApprovalRequest`), `timesheet.ts` (tổng hợp bảng công thật từ
AttendanceRecord + ShiftAssignment + LeaveRequest đã duyệt — **không suy đoán** giờ
làm nếu thiếu dữ liệu: ngày chỉ có chấm vào không có chấm ra → 0 giờ, UI hiện "Chưa
chấm ra" thay vì bịa số).

`lib/attendance/geo.ts#distanceMeters()` — công thức Haversine thuần (không thư viện
ngoài) tính khoảng cách thật giữa 2 toạ độ.

### UI

Nav mới "Chấm công": Chấm công (`/attendance/checkin`), Bảng công
(`/attendance/timesheet`), Đơn nghỉ phép (`/attendance/leave`), Xếp ca
(`/attendance/shifts`, manage), Địa điểm chấm công (`/attendance/locations`,
manage). `/attendance/qr/[token]` — trang đích khi quét QR, **chấm công NGAY lúc
render trang** (tương tự link xác thực email 1 lần dùng), không cần thêm 1 cú bấm.

Dependency mới: `qrcode` (+ `@types/qrcode`) — sinh QR thật client-side, không dùng
API/service ngoài (không rò rỉ token check-in ra bên thứ 3).

## Kiểm tra đã thực hiện (browser + service-level, dữ liệu thật)

1. **Thủ công**: đăng nhập `sales@vimove.vn`, bấm "Chấm công thủ công" → ghi nhận
   thật, "Lượt tiếp theo" tự đổi Vào ↔ Ra.
2. **Bảng công**: seed sẵn 3 ngày chấm công thật (9.25h/ngày) + 1 đơn nghỉ phép đã
   duyệt (2 ngày) → trang tự tổng hợp đúng 27.75h tổng, hiện đúng badge "Nghỉ phép
   năm" cho 2 ngày nghỉ, "Chưa chấm ra" cho ngày chỉ mới chấm vào — không có số giờ
   bịa.
3. **Đơn nghỉ phép**: tạo đơn thật (15–16/9/2026, chọn "Quản trị viên VIMOVE" làm
   người duyệt) → xuất hiện đúng trong Approval Hub thật của admin, bấm Duyệt → trạng
   thái đổi "Đã duyệt" trên cả 2 trang (Đơn nghỉ phép + Approval Hub) — chứng minh tái
   dùng Approval Engine thật, không phải hiệu ứng UI giả.
4. **QR động**: mở `/attendance/locations` → "Hiện QR" → xác nhận token THẬT được tạo
   trong bảng `qr_checkin_tokens` mỗi ~20s (query DB trực tiếp, thấy token/expiresAt
   khác nhau qua từng lần) → dùng đúng token hiện tại mở `/attendance/qr/[token]` →
   chấm công thành công thật; dùng token bịa → bị từ chối "Mã QR không hợp lệ."
5. **GPS**: trình duyệt test không cấp được quyền định vị thật (môi trường sandbox),
   verify trực tiếp ở tầng service bằng script độc lập gọi đúng logic Haversine +
   bán kính trong `checkin.ts`: toạ độ TP.HCM so với văn phòng seed ở Hà Nội → từ chối
   đúng với khoảng cách tính được **1,143,504m** (khớp thực tế ~1,140km Hà Nội↔TP.HCM);
   toạ độ sát văn phòng → chấp nhận với khoảng cách **15m**. Nút "Chấm công GPS" trên
   UI cũng xác nhận gọi đúng `navigator.geolocation.getCurrentPosition` và hiện đúng
   toast lỗi thật khi trình duyệt từ chối quyền (`PERMISSION_DENIED`).
6. **Xếp ca**: tạo mới 1 lượt xếp ca thật (Chủ nhật 20/9, Ca hành chính) → xuất hiện
   ngay trong bảng — xoá lại → biến mất đúng, không còn trong DB.
7. `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` — cả 4 pass sạch
   (64 route, +6 so với trước phase này; 3/3 test tự động pass).

## Việc còn lại / giới hạn đã biết

1. **Wifi nội bộ / FaceID / máy vân tay** — không làm được trên web app thuần, đã ghi
   rõ lý do trong UI (xem bảng ở trên). Nếu sau này cần, hướng khả thi nhất là 1 app
   di động native riêng (React Native/Flutter) có quyền truy cập phần cứng thật.
2. **Tính lương tự động** — cố ý ngoài phạm vi phase này (đã thống nhất với người
   dùng khi chốt scope), có thể làm phase riêng sau, dùng thẳng `computeMonthlyTimesheet()`
   làm nguồn dữ liệu giờ công.
3. **Xếp ca hiện là danh sách phẳng 14 ngày tới**, chưa có lưới dạng lịch/kéo-thả —
   đủ dùng cho quy mô nhỏ, có thể nâng cấp giao diện sau nếu số lượng nhân sự lớn hơn
   nhiều.
4. **1 tổ chức = 1 múi giờ** — `Shift.startTime`/`endTime` lưu dạng chuỗi "HH:mm",
   chưa tính múi giờ riêng theo địa điểm nếu tổ chức có nhiều chi nhánh khác múi giờ.
