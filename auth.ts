import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import type { PermissionKey } from "@/lib/permissions/catalog";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Phase 10 — Scale: thứ tự "rộng thắng hẹp" khi user có nhiều role cấp scope khác
// nhau cho cùng 1 permission (vd vừa có role Trưởng phòng vừa có role thường) — luôn
// lấy scope RỘNG NHẤT trong các role của họ, không làm mất quyền đã có.
const SCOPE_RANK: Record<string, number> = { OWN: 0, DEPARTMENT: 1, ALL: 2 };
function widerScope(a: string, b: string): string {
  return SCOPE_RANK[a] >= SCOPE_RANK[b] ? a : b;
}

async function loadUserPermissions(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const roleKeys = userRoles.map((ur) => ur.role.key);
  const permissionSet = new Set<PermissionKey>();
  const scopeByPermission = new Map<PermissionKey, string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) {
      const key = rp.permission.key as PermissionKey;
      permissionSet.add(key);
      const existing = scopeByPermission.get(key);
      scopeByPermission.set(key, existing ? widerScope(existing, rp.scope) : rp.scope);
    }
  }
  return {
    roleKeys,
    permissions: Array.from(permissionSet),
    permissionScopes: Object.fromEntries(scopeByPermission) as Record<PermissionKey, string>,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
    // Google Workspace SSO — chỉ cho đăng nhập nếu email đã tồn tại sẵn trong bảng User
    // (do Admin tạo qua trang Người dùng). Google KHÔNG tự tạo tài khoản mới — giữ đúng
    // mô hình "Admin cấp tài khoản", tránh ai có Google Workspace cũng tự vào được.
    Google,
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (account?.provider !== "google") return true;

      const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN;
      if (workspaceDomain && profile?.hd !== workspaceDomain) {
        return false;
      }

      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      return !!dbUser && dbUser.status === "ACTIVE";
    },
    jwt: async ({ token, user, trigger }) => {
      // Ở lần đăng nhập đầu (Credentials hoặc Google), `user.email` luôn có — tra lại DB
      // theo email để lấy id/organizationId THẬT của hệ thống (không dùng id của provider).
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.userId = dbUser.id;
          token.organizationId = dbUser.organizationId;
          token.departmentId = dbUser.departmentId;
          await prisma.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
        }
      }
      if (user || trigger === "update" || !token.permissions) {
        const userId = token.userId as string | undefined;
        if (userId) {
          const { roleKeys, permissions, permissionScopes } = await loadUserPermissions(userId);
          token.roleKeys = roleKeys;
          token.permissions = permissions;
          token.permissionScopes = permissionScopes;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.organizationId = token.organizationId as string;
        session.user.departmentId = (token.departmentId as string | null) ?? null;
        session.user.roleKeys = (token.roleKeys as string[]) ?? [];
        session.user.permissions = (token.permissions as PermissionKey[]) ?? [];
        session.user.permissionScopes = (token.permissionScopes as Record<string, string>) ?? {};
      }
      return session;
    },
  },
});
