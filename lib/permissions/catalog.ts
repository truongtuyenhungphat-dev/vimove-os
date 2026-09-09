/**
 * Danh mục permission dạng resource.action (§21 đặc tả).
 * Đây là nguồn sự thật duy nhất cho permission key — Prisma `Permission` rows được
 * seed từ danh sách này (prisma/seed.ts), không tạo permission mới trực tiếp qua UI.
 *
 * Mỗi phase mới sẽ nối thêm entry vào đây (vd: "tasks.create" ở Phase 2,
 * "campaigns.manage" ở Phase 5, "ai.actions.approve" ở Phase 8...).
 */
export const PERMISSIONS = [
  // Organization / Settings
  { key: "organization.manage", resource: "organization", action: "manage", description: "Sửa thông tin & cấu hình tổ chức" },

  // Users
  { key: "users.read", resource: "users", action: "read", description: "Xem danh sách người dùng" },
  { key: "users.create", resource: "users", action: "create", description: "Tạo người dùng mới" },
  { key: "users.update", resource: "users", action: "update", description: "Sửa thông tin người dùng" },
  { key: "users.delete", resource: "users", action: "delete", description: "Vô hiệu hoá/xoá người dùng" },

  // Departments
  { key: "departments.read", resource: "departments", action: "read", description: "Xem phòng ban" },
  { key: "departments.create", resource: "departments", action: "create", description: "Tạo phòng ban" },
  { key: "departments.update", resource: "departments", action: "update", description: "Sửa phòng ban" },
  { key: "departments.delete", resource: "departments", action: "delete", description: "Xoá phòng ban" },

  // Teams
  { key: "teams.read", resource: "teams", action: "read", description: "Xem nhóm" },
  { key: "teams.create", resource: "teams", action: "create", description: "Tạo nhóm" },
  { key: "teams.update", resource: "teams", action: "update", description: "Sửa nhóm" },
  { key: "teams.delete", resource: "teams", action: "delete", description: "Xoá nhóm" },

  // Roles & Permissions
  { key: "roles.read", resource: "roles", action: "read", description: "Xem vai trò & quyền" },
  { key: "roles.manage", resource: "roles", action: "manage", description: "Gán vai trò & cấu hình quyền" },

  // Audit
  { key: "audit_logs.read", resource: "audit_logs", action: "read", description: "Xem nhật ký audit" },

  // Notifications (mọi user đăng nhập đều có quyền này với thông báo của chính mình)
  { key: "notifications.read", resource: "notifications", action: "read", description: "Xem thông báo của bản thân" },

  // Work Hub (Phase 2) — CRUD task + checklist/comment/attachment/dependency/watcher/time
  // log/tag đều nằm chung dưới "tasks.update" (giống mức độ chi tiết của Phase 1, không
  // tách permission cho từng sub-resource).
  { key: "tasks.read", resource: "tasks", action: "read", description: "Xem công việc" },
  { key: "tasks.create", resource: "tasks", action: "create", description: "Tạo công việc mới" },
  { key: "tasks.update", resource: "tasks", action: "update", description: "Sửa công việc, checklist, bình luận, đính kèm, phụ thuộc, theo dõi, log thời gian" },
  { key: "tasks.delete", resource: "tasks", action: "delete", description: "Xoá công việc" },
  { key: "task_templates.manage", resource: "task_templates", action: "manage", description: "Quản lý mẫu công việc" },

  // Project & Process (Phase 3)
  { key: "projects.read", resource: "projects", action: "read", description: "Xem dự án" },
  { key: "projects.create", resource: "projects", action: "create", description: "Tạo dự án mới" },
  { key: "projects.update", resource: "projects", action: "update", description: "Sửa dự án, milestone, thành viên, file" },
  { key: "projects.delete", resource: "projects", action: "delete", description: "Xoá dự án" },
  { key: "workflows.read", resource: "workflows", action: "read", description: "Xem workflow & lịch sử chạy" },
  { key: "workflows.manage", resource: "workflows", action: "manage", description: "Tạo/sửa/publish/chạy thử workflow" },
  { key: "approvals.read", resource: "approvals", action: "read", description: "Xem & xử lý yêu cầu duyệt được giao cho mình" },
  { key: "approvals.manage", resource: "approvals", action: "manage", description: "Xem toàn bộ yêu cầu duyệt trong tổ chức, huỷ/chuyển người duyệt" },

  // CRM & Sales (Phase 4)
  { key: "leads.read", resource: "leads", action: "read", description: "Xem lead & pipeline" },
  { key: "leads.create", resource: "leads", action: "create", description: "Tạo lead mới" },
  { key: "leads.update", resource: "leads", action: "update", description: "Sửa lead, đổi stage, ghi hoạt động, chuyển thành khách hàng" },
  { key: "leads.delete", resource: "leads", action: "delete", description: "Xoá lead" },
  { key: "customers.read", resource: "customers", action: "read", description: "Xem khách hàng & Customer 360" },
  { key: "customers.create", resource: "customers", action: "create", description: "Tạo khách hàng mới" },
  { key: "customers.update", resource: "customers", action: "update", description: "Sửa thông tin khách hàng" },
  { key: "customers.delete", resource: "customers", action: "delete", description: "Xoá khách hàng" },
  { key: "orders.read", resource: "orders", action: "read", description: "Xem đơn hàng" },
  { key: "orders.create", resource: "orders", action: "create", description: "Tạo đơn hàng mới" },
  { key: "orders.update", resource: "orders", action: "update", description: "Sửa đơn hàng, đổi trạng thái" },
  { key: "orders.delete", resource: "orders", action: "delete", description: "Xoá đơn hàng" },
  { key: "sales_catalog.manage", resource: "sales_catalog", action: "manage", description: "Quản lý pipeline/stage, sản phẩm, kênh bán" },

  // Marketing (Phase 5)
  { key: "campaigns.read", resource: "campaigns", action: "read", description: "Xem chiến dịch & KPI" },
  { key: "campaigns.create", resource: "campaigns", action: "create", description: "Tạo chiến dịch mới" },
  { key: "campaigns.update", resource: "campaigns", action: "update", description: "Sửa chiến dịch, kênh trong chiến dịch" },
  { key: "campaigns.delete", resource: "campaigns", action: "delete", description: "Xoá chiến dịch" },
  { key: "content.read", resource: "content", action: "read", description: "Xem Content Hub" },
  { key: "content.create", resource: "content", action: "create", description: "Tạo nội dung mới" },
  { key: "content.update", resource: "content", action: "update", description: "Sửa nội dung, đổi trạng thái, đính kèm" },
  { key: "content.delete", resource: "content", action: "delete", description: "Xoá nội dung" },
  { key: "marketing_channels.read", resource: "marketing_channels", action: "read", description: "Xem Social/Landing Page/Email Campaign" },
  { key: "marketing_channels.manage", resource: "marketing_channels", action: "manage", description: "Tạo/sửa tài khoản mạng xã hội, bài đăng, landing page, email campaign" },

  // Ads Integration (Phase 6)
  { key: "ads.read", resource: "ads", action: "read", description: "Xem kết nối quảng cáo, tài khoản, chiến dịch, số liệu" },
  { key: "ads.manage", resource: "ads", action: "manage", description: "Kết nối/ngắt kết nối tài khoản quảng cáo, đồng bộ thủ công" },

  // Analytics (Phase 7)
  { key: "analytics.read", resource: "analytics", action: "read", description: "Xem dashboard, report, Data Quality Hub" },
  { key: "analytics.manage", resource: "analytics", action: "manage", description: "Tạo/sửa report, tính lại số liệu, quét & xử lý data quality issue" },

  // AI Command Center (Phase 8)
  { key: "ai.read", resource: "ai", action: "read", description: "Dùng AI Work Assistant, xem insight & đề xuất" },
  { key: "ai.manage", resource: "ai", action: "manage", description: "Tạo insight mới, duyệt/từ chối đề xuất hành động của AI" },

  // Observability (Phase 10 — Scale)
  { key: "observability.read", resource: "observability", action: "read", description: "Xem nhật ký lỗi hệ thống (Error Log)" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

/**
 * Phase 10 — Scale: permission nào lọc row theo người sở hữu (assignee/owner) và có
 * thể bị THU HẸP THÊM bằng `RolePermission.scope` (ALL/DEPARTMENT/OWN, xem
 * prisma/schema.prisma). Permission ngoài danh sách này luôn coi như ALL — scope chỉ
 * có ý nghĩa với resource có khái niệm "của ai" rõ ràng (assignee của Task, owner của
 * Lead), không áp cho permission quản trị/toàn tổ chức (vd `roles.manage`).
 */
export const SCOPABLE_PERMISSIONS: PermissionKey[] = ["tasks.read", "leads.read"];
