/**
 * Đồng bộ CHỈ permission catalog + role-permission cho production — KHÔNG chạy
 * prisma/seed.ts đầy đủ vì file đó có khối "demo data" (CRM/Marketing/Attendance
 * mẫu) mà rule dự án nói rõ seed data tách khỏi production path. Script này chỉ
 * lặp lại đúng 2 bước đầu của seed.ts (permission catalog + role default
 * permissions), upsert nên an toàn chạy lại nhiều lần — dùng để nạp 4 quyền
 * warranty.* mới (Phase 15) vào production mà không đụng gì khác.
 *
 * Chạy: DATABASE_URL=<production> npx tsx scripts/sync-warranty-permissions.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERMISSIONS } from "../lib/permissions/catalog";
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_PERMISSION_SCOPES, ROLE_LABELS } from "../lib/permissions/role-defaults";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLE_KEYS = Object.keys(ROLE_LABELS);

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) throw new Error("Không tìm thấy organization 'vimove' — không chạy script này trước khi seed cơ bản đã tồn tại.");

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));
  console.log(`Permissions: ${allPermissions.length}`);

  for (const key of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: organization.id, key: key as never } },
      update: {},
      create: { organizationId: organization.id, key: key as never, name: ROLE_LABELS[key], isSystem: true },
    });

    const defaultKeys = DEFAULT_ROLE_PERMISSIONS[key] ?? [];
    const scopeOverrides = DEFAULT_PERMISSION_SCOPES[key] ?? {};
    for (const permKey of defaultKeys) {
      const permission = permissionByKey.get(permKey);
      if (!permission) continue;
      const scope = scopeOverrides[permKey] ?? "ALL";
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { scope },
        create: { roleId: role.id, permissionId: permission.id, scope },
      });
    }
  }
  console.log(`Roles đồng bộ: ${ROLE_KEYS.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
