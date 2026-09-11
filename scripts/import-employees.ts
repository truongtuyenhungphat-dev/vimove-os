/**
 * Nạp danh sách nhân viên thật từ hệ thống cũ (Legacy VimoveCRM) vào VIMOVE OS —
 * đối chiếu thủ công 2 file `tai-khoan-dang-nhap.csv` (tài khoản đăng nhập thật, có
 * uid/lịch sử đăng nhập) + `nhan-vien-ho-so.csv` (hồ sơ tên/vai trò/phòng ban) do
 * người dùng cung cấp, loại bỏ:
 *   - 5 dòng hồ sơ rác/placeholder (không có uid, chưa từng đăng nhập, số điện thoại
 *     mẫu kiểu 0912345678, tạo hàng loạt cùng 1 phút — mkt@, sales@, kythuat@,
 *     2 dòng admin@vimove.com.vn trùng).
 *   - 3 tài khoản đăng nhập thật nhưng KHÔNG có hồ sơ tên/vai trò đi kèm
 *     (admin@vimove.com.vn, trang@vimove.net, tntuyen61@gmail.com) — theo yêu cầu
 *     người dùng, bỏ qua đợt này, thêm sau qua trang Admin nếu cần.
 *
 * Dùng chung 1 mật khẩu tạm cho toàn bộ 16 người (theo lựa chọn người dùng) — PHẢI
 * đổi ngay sau lần đăng nhập đầu (trang Hồ sơ đã có sẵn tính năng đổi mật khẩu).
 *
 * Mapping department: cả 5 phòng ban cũ (Marketing, Vận hành, Sales & CSKH,
 * Giám đốc, Quản lý chung) đều gộp về đúng 4 phòng ban đã seed sẵn — không tạo
 * phòng ban mới.
 *
 * Mapping role (role cũ → RoleKey mới, do người dùng xác nhận qua bảng đề xuất):
 *   van_hanh (chủ hệ thống)  → SUPER_ADMIN
 *   qly_chung (quyền gần admin) → ADMIN
 *   giam_doc                 → DIRECTOR
 *   content_lead              → MARKETING_MANAGER (chưa có role Content Manager riêng)
 *   sales                     → SALES
 *   mkt (11 người)            → MARKETING_STAFF
 *
 * Chạy: npx tsx scripts/import-employees.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import type { RoleKey } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEMP_PASSWORD = "Vimove@2026";

type EmployeeRow = {
  email: string;
  name: string;
  title: string;
  roleKey: RoleKey;
  departmentId: string;
};

// departmentId dùng đúng id cố định đã có trong prisma/seed.ts — không tạo mới.
const DEPT = {
  executive: "seed-dept-executive", // Ban Giám đốc
  marketing: "seed-dept-marketing", // Phòng Marketing
  sales: "seed-dept-sales", // Phòng Kinh doanh
  ops: "seed-dept-ops", // Phòng Vận hành
};

const EMPLOYEES: EmployeeRow[] = [
  { email: "tuyen@vimove.net", name: "Trương Ngọc Tuyền", title: "Quản trị hệ thống", roleKey: "SUPER_ADMIN", departmentId: DEPT.ops },
  { email: "trang@vimove.vn", name: "Nguyễn Quỳnh Trang", title: "Quản lý chung", roleKey: "ADMIN", departmentId: DEPT.executive },
  { email: "nganntt@gmail.com", name: "Nguyễn Thị Thanh Ngân", title: "Giám đốc", roleKey: "DIRECTOR", departmentId: DEPT.executive },
  { email: "hqphuong@vimove.com.vn", name: "Hoàng Quỳnh Phương", title: "Content Lead", roleKey: "MARKETING_MANAGER", departmentId: DEPT.marketing },
  { email: "thaile@vimove.com.vn", name: "Lê Thị Anh Thái", title: "Nhân viên Kinh doanh", roleKey: "SALES", departmentId: DEPT.sales },
  { email: "tungvh@vimove.com.vn", name: "Vũ Hoàng Tùng", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "nganlt@vimove.com.vn", name: "Lê Thị Ngân", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "nguyetnm@vimove.com.vn", name: "Nguyễn Minh Nguyệt", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "baclv@vimove.com.vn", name: "Lý Việt Bắc", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "dungkt@vimove.com.vn", name: "Khuất Thị Dung", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "thaodpn@vimove.com.vn", name: "Đặng Phạm Ngọc Thảo", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "chitl@vimove.com.vn", name: "Trịnh Linh Chi", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "loinv@vimove.com.vn", name: "Nguyễn Văn Lợi", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "thaonp@vimove.com.vn", name: "Nguyễn Phương Thảo", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "ducdm@vimove.com.vn", name: "Dương Minh Đức", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
  { email: "maiptt@vimove.com.vn", name: "Phạm Thị Thanh Mai", title: "Nhân viên Marketing", roleKey: "MARKETING_STAFF", departmentId: DEPT.marketing },
];

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) throw new Error("Không tìm thấy organization 'vimove'.");

  const roles = await prisma.role.findMany({ where: { organizationId: organization.id } });
  const roleByKey = new Map(roles.map((r) => [r.key, r]));

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);

  let created = 0;
  let skipped = 0;

  for (const emp of EMPLOYEES) {
    const existing = await prisma.user.findUnique({ where: { email: emp.email } });
    if (existing) {
      console.log(`Bỏ qua (đã tồn tại): ${emp.email}`);
      skipped++;
      continue;
    }
    const role = roleByKey.get(emp.roleKey);
    if (!role) throw new Error(`Không tìm thấy role ${emp.roleKey} trong organization.`);

    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: emp.email,
        name: emp.name,
        passwordHash,
        departmentId: emp.departmentId,
        title: emp.title,
        userRoles: { create: [{ roleId: role.id }] },
      },
    });
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: null,
        action: "user.import",
        entityType: "User",
        entityId: user.id,
        after: { email: user.email, name: user.name, role: emp.roleKey, source: "legacy-vimovecrm-import" },
      },
    });
    console.log(`Đã tạo: ${emp.name} <${emp.email}> — ${emp.roleKey}`);
    created++;
  }

  console.log(`\nHoàn tất: ${created} tài khoản mới, ${skipped} đã tồn tại (bỏ qua).`);
  console.log(`Mật khẩu tạm dùng chung: ${TEMP_PASSWORD} — YÊU CẦU mọi người đổi ngay sau lần đăng nhập đầu (trang Hồ sơ).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
